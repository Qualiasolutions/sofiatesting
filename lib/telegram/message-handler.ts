import "server-only";
import { convertToModelMessages, streamText } from "ai";
import { myProvider } from "../ai/providers";
import { systemPrompt } from "../ai/prompts";
import {
  calculateCapitalGainsTool,
  calculateTransferFeesTool,
  calculateVATTool,
} from "../ai/tools";
import { isProductionEnvironment } from "../constants";
import {
  getChatById,
  getMessagesByChatId,
  saveChat,
  saveMessages,
} from "../db/queries";
import type { ChatMessage } from "../types";
import { convertToUIMessages, generateUUID } from "../utils";
import { getTelegramClient } from "./client";
import type { TelegramMessage } from "./types";
import { getTelegramChatId, getTelegramUser } from "./user-mapping";

/**
 * Handle incoming Telegram message and generate AI response
 */
export async function handleTelegramMessage(
  message: TelegramMessage
): Promise<void> {
  if (!message.from || message.from.is_bot) {
    return; // Ignore bot messages
  }

  if (!message.text) {
    // Handle non-text messages
    await sendTelegramMessage(
      message.chat.id,
      "I can only process text messages at the moment. Please send me a text message!"
    );
    return;
  }

  const telegramClient = getTelegramClient();
  const chatId = message.chat.id;

  try {
    // Show typing indicator
    await telegramClient.sendChatAction({ chatId });

    // Get or create user
    const dbUser = await getTelegramUser(message.from);

    // Get or create persistent chat session
    const sessionChatId = getTelegramChatId(message.from.id);

    // Check if chat exists
    let chat = await getChatById({ id: sessionChatId });

    if (!chat) {
      // Create new chat session
      await saveChat({
        id: sessionChatId,
        userId: dbUser.id,
        title: `Telegram Chat - ${message.from.first_name}`,
        visibility: "private",
      });
    }

    // Get message history
    const messagesFromDb = await getMessagesByChatId({ id: sessionChatId });
    const previousMessages = convertToUIMessages(messagesFromDb);

    // Create new user message
    const userMessage: ChatMessage = {
      id: generateUUID(),
      role: "user",
      parts: [{ type: "text", text: message.text }],
    };

    // Save user message to database
    await saveMessages({
      messages: [
        {
          chatId: sessionChatId,
          id: userMessage.id,
          role: "user",
          parts: userMessage.parts,
          attachments: [],
          createdAt: new Date(),
        },
      ],
    });

    // Prepare messages for AI
    const allMessages = [...previousMessages, userMessage];

    // Generate AI response
    let fullResponse = "";
    let assistantMessageId = generateUUID();

    const result = await streamText({
      model: myProvider.languageModel("chat-model-gemini"), // Use Gemini for Telegram (fastest & cheapest)
      system: `${systemPrompt({
        selectedChatModel: "chat-model-gemini",
        requestHints: {
          latitude: undefined,
          longitude: undefined,
          city: undefined,
          country: "Cyprus", // Default to Cyprus for SOFIA
        },
      })}

TELEGRAM CHAT PERSONALITY:
You are SOFIA - the Zyprus Property Group AI Assistant, but with a friendly, conversational tone suitable for Telegram messaging.

GUIDELINES:
- Be warm, friendly, and approachable in your responses
- Use emojis occasionally when appropriate (🏠💼📊💰)
- Keep paragraphs relatively short for better mobile readability
- If someone greets you, greet them back warmly
- Be helpful and proactive in offering assistance
- Maintain your expertise as a Cyprus real estate professional
- Feel free to ask clarifying questions if needed
- Use formatting like <b>bold</b> for emphasis on important information

Remember: You're chatting on Telegram, so keep it natural and conversational while maintaining professionalism.`,
      messages: convertToModelMessages(allMessages),
      experimental_activeTools: [
        "calculateTransferFees",
        "calculateCapitalGains",
        "calculateVAT",
      ],
      tools: {
        calculateTransferFees: calculateTransferFeesTool,
        calculateCapitalGains: calculateCapitalGainsTool,
        calculateVAT: calculateVATTool,
      },
      experimental_telemetry: {
        isEnabled: isProductionEnvironment,
        functionId: "telegram-stream-text",
      },
    });

    // Collect response text
    for await (const textPart of result.textStream) {
      fullResponse += textPart;

      // Send typing indicator periodically
      if (fullResponse.length % 500 === 0) {
        await telegramClient.sendChatAction({ chatId });
      }
    }

    // Tool results will be included in the text stream automatically

    // Save assistant message to database
    await saveMessages({
      messages: [
        {
          chatId: sessionChatId,
          id: assistantMessageId,
          role: "assistant",
          parts: [{ type: "text", text: fullResponse }],
          attachments: [],
          createdAt: new Date(),
        },
      ],
    });

    // Convert markdown bold (**text**) to Telegram markdown (*text*)
    const telegramFormattedResponse = formatForTelegram(fullResponse);

    // Send response to Telegram
    await telegramClient.sendLongMessage({
      chatId,
      text: telegramFormattedResponse,
      replyToMessageId: message.message_id,
    });
  } catch (error) {
    console.error("Error handling Telegram message:", error);
    await sendTelegramMessage(
      chatId,
      "Sorry, I encountered an error processing your message. Please try again later."
    );
  }
}

/**
 * Format text for Telegram HTML
 * Converts markdown to HTML for better Telegram compatibility
 */
function formatForTelegram(text: string): string {
  let formatted = text;

  // Convert **bold** to <b>bold</b>
  formatted = formatted.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");

  // Convert *italic* to <i>italic</i>
  formatted = formatted.replace(/\*(.+?)\*/g, "<i>$1</i>");

  // Convert code blocks to preformatted text
  formatted = formatted.replace(/```[\s\S]*?```/g, (match) => {
    const code = match.replace(/```/g, "").trim();
    return `<code>${code}</code>`;
  });

  // Convert inline code
  formatted = formatted.replace(/`([^`]+)`/g, "<code>$1</code>");

  // Clean up multiple newlines
  formatted = formatted.replace(/\n{3,}/g, "\n\n");

  // Ensure proper spacing for lists
  formatted = formatted.replace(/(\d+\.)/g, "\n$1");
  formatted = formatted.replace(/([•\-\*])/g, "\n$1");

  // Convert newlines to HTML line breaks for better formatting
  formatted = formatted.replace(/\n/g, "<br>");

  return formatted.trim();
}

/**
 * Send a message to Telegram (helper function)
 */
async function sendTelegramMessage(
  chatId: number,
  text: string
): Promise<void> {
  const telegramClient = getTelegramClient();
  await telegramClient.sendMessage({ chatId, text });
}
