import "server-only";
import { convertToModelMessages, streamText } from "ai";
import { systemPrompt } from "../ai/prompts";
import { myProvider } from "../ai/providers";
import { calculateCapitalGainsTool } from "../ai/tools/calculate-capital-gains";
import { calculateTransferFeesTool } from "../ai/tools/calculate-transfer-fees";
import { calculateVATTool } from "../ai/tools/calculate-vat";
import { getGeneralKnowledge } from "../ai/tools/get-general-knowledge";
import { isProductionEnvironment } from "../constants";
import type { ChatMessage } from "../types";
import { generateUUID } from "../utils";
import { getWhatsAppClient } from "./client";
import type { WaSenderMessageData } from "./types";
import { shouldSendAsDocument, getDocumentType } from "./document-detector";
import { generateDocx } from "./docx-generator";

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
    // Get the model for Telegram/WhatsApp interactions
    const chatModel = myProvider.languageModel("chat-model");

    // Create message for AI
    const message: ChatMessage = {
      id: generateUUID(),
      role: "user",
      parts: [{ type: "text", text: userMessage }],
    };

    // Generate AI response
    let fullResponse = "";

    const result = await streamText({
      model: chatModel,
      system: await systemPrompt({
        selectedChatModel: "chat-model",
        requestHints: {
          latitude: undefined,
          longitude: undefined,
          city: undefined,
          country: "Cyprus",
        },
        userMessage: userMessage,
      }),
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
        getGeneralKnowledge: getGeneralKnowledge,
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
        text:
          "I encountered an error processing your message. Please try again or rephrase your question.",
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
