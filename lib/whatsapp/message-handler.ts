import "server-only";
import { convertToModelMessages, generateObject, streamText } from "ai";
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
import { getGeneralKnowledge } from "../ai/tools/get-general-knowledge";
import { isProductionEnvironment } from "../constants";
import type { ChatMessage } from "../types";
import { generateUUID } from "../utils";
import { getWhatsAppClient } from "./client";
import { getDocumentType, shouldSendAsDocument } from "./document-detector";
import { generateDocx } from "./docx-generator";
import type { WaSenderMessageData } from "./types";

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

  try {
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
      },
    });

    // STEP 1: ROUTING (Cost Optimization)
    // Use Flash-Lite to decide intent
    const routerModel = myProvider.languageModel(ROUTER_MODEL);
    const { object: classification } = await generateObject({
      model: routerModel,
      schema: IntentClassificationSchema,
      prompt: `Classify the user intent for this real estate assistant message: "${userMessage}"`,
    });

    console.log("Router Classification:", classification);

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
      }
    }

    // Prepare system prompt with extracted data context if available
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

    let finalSystemPrompt = baseSystemPrompt;
    if (extractedData) {
      finalSystemPrompt += `\n\nCONTEXT FROM STRUCTURED EXTRACTION:\n${JSON.stringify(
        extractedData,
        null,
        2
      )}\n\nUse this extracted data to either generate the document (if complete) or ask for missing fields.`;
    }

    // Main Chat Execution (Worker Model)
    const chatModel = myProvider.languageModel(WORKER_MODEL);
    const message: ChatMessage = {
      id: generateUUID(),
      role: "user",
      parts: [{ type: "text", text: userMessage }],
    };

    const result = await streamText({
      model: chatModel,
      system: finalSystemPrompt,
      messages: convertToModelMessages([message]),
      experimental_activeTools: [
        "calculateTransferFees",
        "calculateCapitalGains",
        "calculateVAT",
        "getGeneralKnowledge",
      ],
      tools: {
        calculateTransferFees: calculateTransferFeesTool,
        calculateCapitalGains: calculateCapitalGainsTool,
        calculateVAT: calculateVATTool,
        getGeneralKnowledge,
      },
      experimental_telemetry: {
        isEnabled: isProductionEnvironment,
        functionId: "whatsapp-stream-text",
      },
    });

    // Collect the response
    for await (const textPart of result.textStream) {
      fullResponse += textPart;
    }

    // Determine if response should be sent as document (forms) or text (emails)
    if (shouldSendAsDocument(fullResponse)) {
      // Generate .docx for forms (templates 01-16)
      const docBuffer = await generateDocx(fullResponse);
      const docType = getDocumentType(fullResponse);
      const filename = `SOFIA_${docType}_${Date.now()}.docx`;

      await client.sendDocument({
        to: phoneNumber,
        document: docBuffer,
        filename,
        caption: "Here is your completed document.",
      });
    } else {
      // Send as plain text message (emails, calculations, etc.)
      const formattedResponse = formatForWhatsApp(fullResponse);
      await client.sendMessage({
        to: phoneNumber,
        text: formattedResponse,
      });
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
