import "server-only";
import {
  convertToModelMessages,
  generateObject,
  stepCountIs,
  streamText,
} from "ai";
import { runWithUserContext } from "@/lib/ai/context";
import { db } from "@/lib/db/client";
import { agentExecutionLog } from "@/lib/db/schema";
import { ROUTER_MODEL, WORKER_MODEL } from "../ai/models";
import { systemPrompt } from "../ai/prompts";
import { myProvider } from "../ai/providers";
import { IntentClassificationSchema } from "../ai/schemas";
import {
  extractDeveloperRegistration,
  extractMarketingAgreement,
  extractSellerRegistration,
  extractViewingForm,
} from "../ai/template-manager";
import { calculateCapitalGainsTool } from "../ai/tools/calculate-capital-gains";
import { calculateTransferFeesTool } from "../ai/tools/calculate-transfer-fees";
import { calculateVATTool } from "../ai/tools/calculate-vat";
import { createLandListingTool } from "../ai/tools/create-land-listing";
import { createListingTool } from "../ai/tools/create-listing";
// import { getGeneralKnowledge } from "../ai/tools/get-general-knowledge"; // DISABLED - Knowledge now embedded in system prompt
import { getZyprusDataTool } from "../ai/tools/get-zyprus-data";
import { listListingsTool } from "../ai/tools/list-listings";
import { uploadLandListingTool } from "../ai/tools/upload-land-listing";
import { uploadListingTool } from "../ai/tools/upload-listing";
import { isProductionEnvironment } from "../constants";
import type { ChatMessage } from "../types";
import { generateUUID } from "../utils";
import { getWhatsAppClient } from "./client";
import { getDocumentType, shouldSendAsDocument } from "./document-detector";
import { generateDocx } from "./docx-generator";
import { createWhatsAppSendDocumentTool } from "./tools/send-document-whatsapp";
import type { WaSenderMessageData } from "./types";
import {
  getOrCreateWhatsAppChat,
  getOrCreateWhatsAppUser,
  updateAgentLastActive,
} from "./user-mapping";

/**
 * Handle incoming WhatsApp message and generate AI response
 */
export async function handleWhatsAppMessage(
  messageData: WaSenderMessageData
): Promise<void> {
  // Only handle text messages for now
  if (messageData.type !== "text" || !messageData.text) {
    console.log("Skipping non-text WhatsApp message:", messageData.type);
    return;
  }

  // Skip group messages unless specifically mentioned
  if (messageData.isGroup) {
    console.log("Skipping group message from:", messageData.groupName);
    return;
  }

  const client = getWhatsAppClient();
  const phoneNumber = messageData.from;
  const userMessage = messageData.text;

  // Default user context (used if DB fails)
  let userContext: {
    id: string;
    email: string;
    name: string;
    type: "guest" | "regular";
  } = {
    id: `whatsapp-${phoneNumber}`,
    email: `${phoneNumber}@whatsapp.local`,
    name: messageData.sender?.name || phoneNumber,
    type: "guest",
  };

  try {
    // Try to get or create user from DB (non-blocking if fails)
    try {
      const dbUser = await getOrCreateWhatsAppUser(phoneNumber);
      const dbChat = await getOrCreateWhatsAppChat(dbUser.id, phoneNumber);

      // Use DB user context if available
      userContext = {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name || phoneNumber,
        type: dbUser.type,
      };

      // Update agent last active if this is a registered agent
      if (dbUser.agentId) {
        await updateAgentLastActive(dbUser.agentId);
      }

      // Log incoming message
      await db.insert(agentExecutionLog).values({
        agentType: "whatsapp",
        action: "message_received",
        modelUsed: "user",
        success: true,
        metadata: {
          from: phoneNumber,
          message: userMessage,
          isGroup: messageData.isGroup,
          userId: dbUser.id,
          chatId: dbChat.id,
          isAgent: dbUser.isAgent,
        },
      });
    } catch (dbError) {
      console.warn("[WhatsApp] DB operations failed, using fallback context:", {
        error: dbError instanceof Error ? dbError.message : "Unknown error",
        phoneNumber,
      });
      // Continue with default user context - AI will still respond
    }

    // STEP 1: ROUTING (Cost Optimization)
    // Use Flash-Lite to decide intent
    console.log("[WhatsApp] Step 1: Starting intent classification...");
    const routerModel = myProvider.languageModel(ROUTER_MODEL);
    const { object: classification } = await generateObject({
      model: routerModel,
      schema: IntentClassificationSchema,
      prompt: `Classify the user intent for this real estate assistant message: "${userMessage}"`,
    });

    console.log("[WhatsApp] Router Classification:", classification);

    // STEP 2: EXECUTION BASED ON INTENT
    let fullResponse = "";
    let extractedData: any = null;
    const _needsDocument = false;

    // Handle specific intents with Structured Extraction
    if (classification.confidence > 0.8) {
      switch (classification.intent) {
        case "developer_registration":
          extractedData = await extractDeveloperRegistration(userMessage);
          // Logic: If we have data, we might still need to ask for missing fields
          // For now, we pass this context to the main chat model to generate the final response/doc
          break;
        case "marketing_agreement":
          extractedData = await extractMarketingAgreement(userMessage);
          break;
        case "viewing_form":
          extractedData = await extractViewingForm(userMessage);
          break;
        case "seller_registration":
          extractedData = await extractSellerRegistration(userMessage);
          break;
        default:
          // Other intents handled by main chat model
          break;
      }
    }

    // Prepare system prompt with extracted data context if available
    console.log("[WhatsApp] Step 2: Building system prompt...");
    const baseSystemPrompt = await systemPrompt({
      selectedChatModel: WORKER_MODEL,
      requestHints: {
        latitude: undefined,
        longitude: undefined,
        city: undefined,
        country: "Cyprus",
      },
      userMessage,
    });
    console.log("[WhatsApp] System prompt length:", baseSystemPrompt.length);

    // Add WhatsApp-specific platform context
    const whatsappContext = `
PLATFORM CONTEXT: WhatsApp Mobile Messaging
- Users are on mobile and expect quick, concise text responses
- Calculator results (VAT, transfer fees, capital gains) should ALWAYS be formatted as text, NOT documents
- Only generate documents when users EXPLICITLY ask: "send document", "generate form", "email me the form", etc.
- For calculator queries, provide clear, formatted text responses with tables if needed
- Use emojis for better readability on mobile where appropriate
- Keep responses concise but complete
- DO NOT auto-generate documents based on content - wait for explicit user request
`;

    let finalSystemPrompt = baseSystemPrompt + whatsappContext;

    if (extractedData) {
      finalSystemPrompt += `\n\nCONTEXT FROM STRUCTURED EXTRACTION:\n${JSON.stringify(
        extractedData,
        null,
        2
      )}\n\nUse this extracted data to either generate the document (if user explicitly requested) or ask for missing fields.`;
    }

    // Main Chat Execution (Worker Model)
    const chatModel = myProvider.languageModel(WORKER_MODEL);
    const message: ChatMessage = {
      id: generateUUID(),
      role: "user",
      parts: [{ type: "text", text: userMessage }],
    };

    // Wrap AI execution with user context so tools can access user info
    const aiUserContext = {
      user: {
        id: userContext.id,
        email: userContext.email,
        name: userContext.name,
        type: userContext.type,
      },
    };

    console.log("[WhatsApp] Step 3: Starting AI generation...");
    fullResponse = await runWithUserContext(aiUserContext, async () => {
      const result = await streamText({
        model: chatModel,
        system: finalSystemPrompt,
        messages: convertToModelMessages([message]),
        temperature: 0, // Match web chat for strict instruction following
        stopWhen: stepCountIs(5), // Limit tool call chains to 5 steps max
        experimental_activeTools: [
          "calculateTransferFees",
          "calculateCapitalGains",
          "calculateVAT",
          // "getGeneralKnowledge", // DISABLED - Knowledge now embedded in system prompt
          "createListing",
          "listListings",
          "uploadListing",
          "getZyprusData",
          "createLandListing",
          "uploadLandListing",
          "sendDocument",
        ],
        tools: {
          calculateTransferFees: calculateTransferFeesTool,
          calculateCapitalGains: calculateCapitalGainsTool,
          calculateVAT: calculateVATTool,
          // getGeneralKnowledge, // DISABLED - Knowledge now embedded in system prompt
          createListing: createListingTool,
          listListings: listListingsTool,
          uploadListing: uploadListingTool,
          getZyprusData: getZyprusDataTool,
          createLandListing: createLandListingTool,
          uploadLandListing: uploadLandListingTool,
          sendDocument: createWhatsAppSendDocumentTool(phoneNumber),
        },
        experimental_telemetry: {
          isEnabled: isProductionEnvironment,
          functionId: "whatsapp-stream-text",
        },
      });

      // Collect the response
      let response = "";
      for await (const textPart of result.textStream) {
        response += textPart;
      }
      console.log("[WhatsApp] AI response collected, length:", response.length);
      return response;
    });

    console.log("[WhatsApp] Step 4: AI generation complete, response length:", fullResponse.length);

    // Determine if response should be sent as document (forms) or text (emails)
    if (shouldSendAsDocument(fullResponse)) {
      // Generate .docx for forms (templates 01-16)
      console.log("[WhatsApp] Step 5: Sending as document...");
      const docBuffer = await generateDocx(fullResponse);
      const docType = getDocumentType(fullResponse);
      const filename = `SOFIA_${docType}_${Date.now()}.docx`;

      const docResult = await client.sendDocument({
        to: phoneNumber,
        document: docBuffer,
        filename,
        caption: "Here is your completed document.",
      });
      console.log("[WhatsApp] Document send result:", docResult);
    } else {
      // Send as plain text message (emails, calculations, etc.)
      // Use sendLongMessage for automatic splitting if response exceeds WhatsApp's 4096 char limit
      console.log("[WhatsApp] Step 5: Sending as text message...");
      const formattedResponse = formatForWhatsApp(fullResponse);
      const textResult = await client.sendLongMessage({
        to: phoneNumber,
        text: formattedResponse,
      });
      console.log("[WhatsApp] Text send result:", textResult);
    }
  } catch (error) {
    console.error("Error handling WhatsApp message:", {
      error: error instanceof Error ? error.message : "Unknown error",
      from: phoneNumber,
      messageText: userMessage.substring(0, 100),
    });

    // Send error message to user
    try {
      await client.sendMessage({
        to: phoneNumber,
        text: "I encountered an error processing your message. Please try again or rephrase your question.",
      });
    } catch (sendError) {
      console.error("Failed to send error message:", sendError);
    }
  }
}

/**
 * Format text for WhatsApp (plain text mode)
 */
function formatForWhatsApp(text: string): string {
  let formatted = text;

  // WhatsApp supports basic markdown: *bold*, _italic_, ~strikethrough~, ```code```
  // Convert our markdown to WhatsApp format

  // Bold: **text** -> *text* (WhatsApp format)
  formatted = formatted.replace(/\*\*(.+?)\*\*/g, "*$1*");

  // Clean up multiple newlines
  formatted = formatted.replace(/\n{3,}/g, "\n\n");

  return formatted.trim();
}
