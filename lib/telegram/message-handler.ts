import "server-only";
import { convertToModelMessages, streamText } from "ai";
import { systemPrompt } from "../ai/prompts";
import { myProvider } from "../ai/providers";
import { calculateCapitalGainsTool } from "../ai/tools/calculate-capital-gains";
import { calculateTransferFeesTool } from "../ai/tools/calculate-transfer-fees";
import { calculateVATTool } from "../ai/tools/calculate-vat";
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

  // Handle /templates command
  if (message.text === "/templates" || message.text === "/template") {
    await handleTemplatesCommand(chatId);
    return;
  }

  // Handle /help command
  if (message.text === "/help" || message.text === "/start") {
    await handleHelpCommand(chatId);
    return;
  }

  try {
    // Show typing indicator
    await telegramClient.sendChatAction({ chatId });

    // Get or create user
    const dbUser = await getTelegramUser(message.from);

    // Get or create persistent chat session
    const sessionChatId = getTelegramChatId(message.from.id);

    // Check if chat exists
    const chat = await getChatById({ id: sessionChatId });

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

    // Generate AI response with retry mechanism
    let fullResponse = "";
    const assistantMessageId = generateUUID();
    let result;
    let retryCount = 0;
    const MAX_RETRIES = 2;
    const STREAM_TIMEOUT_MS = 45000; // 45 seconds

    while (retryCount <= MAX_RETRIES) {
      try {
        result = await streamText({
          model: myProvider.languageModel("chat-model"), // Use Gemini 2.5 Flash for Telegram (reliable & fast)
          system: `${systemPrompt({
            selectedChatModel: "chat-model",
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
- Use simple text formatting (no HTML) for maximum compatibility

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
        break; // Success - exit retry loop
      } catch (streamError) {
        retryCount++;
        console.error(`AI stream attempt ${retryCount} failed:`, {
          chatId,
          attempt: retryCount,
          error: streamError instanceof Error ? streamError.message : "Unknown",
          stack: streamError instanceof Error ? streamError.stack : undefined,
        });

        if (retryCount > MAX_RETRIES) {
          throw new Error(
            `AI service unavailable after ${MAX_RETRIES} retries: ${streamError instanceof Error ? streamError.message : "Unknown error"}`
          );
        }

        // Wait before retry (exponential backoff: 1s, 2s)
        await new Promise((resolve) => setTimeout(resolve, 1000 * retryCount));
      }
    }

    // Collect response text with timeout protection
    const TYPING_INTERVAL_MS = 3000; // 3 seconds
    let lastTypingIndicator = Date.now();
    const streamStartTime = Date.now();

    // TypeScript: result is guaranteed to be defined here (retry loop ensures it)
    if (!result) {
      throw new Error("AI model failed to initialize");
    }

    for await (const textPart of result.textStream) {
      // Check for timeout
      if (Date.now() - streamStartTime > STREAM_TIMEOUT_MS) {
        console.error("AI stream timeout exceeded", {
          chatId,
          duration: Date.now() - streamStartTime,
          partialResponse: fullResponse.substring(0, 200),
        });
        throw new Error("Response generation timeout");
      }

      fullResponse += textPart;

      // Send typing indicator periodically (time-based, not character-based)
      const now = Date.now();
      if (now - lastTypingIndicator >= TYPING_INTERVAL_MS) {
        await telegramClient.sendChatAction({ chatId });
        lastTypingIndicator = now;
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

    // Format response for Telegram (plain text mode)
    const telegramFormattedResponse = formatForTelegram(fullResponse);

    // Send response to Telegram with plain text mode
    await telegramClient.sendLongMessage({
      chatId,
      text: telegramFormattedResponse,
      replyToMessageId: message.message_id,
      parseMode: undefined, // Use plain text mode to avoid HTML parsing errors
    });
  } catch (error) {
    const errorId = Date.now();
    console.error("Error handling Telegram message:", {
      errorId,
      chatId,
      fromUser: message.from,
      messageText: message.text?.substring(0, 100),
      error,
      errorMessage: error instanceof Error ? error.message : "Unknown error",
      errorStack: error instanceof Error ? error.stack : undefined,
    });

    try {
      // Send user-friendly error message with error ID for support
      await telegramClient.sendMessage({
        chatId,
        text:
          "⚠️ I encountered an error processing your message.\n\n" +
          "Please try:\n" +
          "• Rephrasing your question\n" +
          "• Using /help for commands\n" +
          "• Contacting support if this persists\n\n" +
          `Error ID: ${errorId}`,
        replyToMessageId: message.message_id,
        parseMode: undefined, // Plain text mode
      });
    } catch (sendError) {
      console.error("Failed to send error message to Telegram:", {
        errorId,
        chatId,
        sendError:
          sendError instanceof Error ? sendError.message : "Unknown error",
        originalError: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
}

/**
 * Format text for Telegram
 * Converts markdown to plain text for maximum compatibility
 * Avoids HTML parsing errors by using plain text mode
 */
function formatForTelegram(text: string): string {
  let formatted = text;

  // Remove markdown formatting for plain text mode
  // Bold: **text** -> text (keep content only)
  formatted = formatted.replace(/\*\*(.+?)\*\*/g, "$1");

  // Italic: *text* -> text (keep content only)
  formatted = formatted.replace(/\*(.+?)\*/g, "$1");

  // Code blocks: ```code``` -> code (keep content only)
  formatted = formatted.replace(/```[\s\S]*?```/g, (match) => {
    const code = match.replace(/```/g, "").trim();
    return code;
  });

  // Inline code: `code` -> code (keep content only)
  formatted = formatted.replace(/`([^`]+)`/g, "$1");

  // Clean up multiple newlines (keep max 2 consecutive newlines)
  formatted = formatted.replace(/\n{3,}/g, "\n\n");

  // Keep newlines as-is - Telegram preserves them in plain text mode
  // No need to convert to <br> tags

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

/**
 * Handle /templates command - List all available templates
 */
async function handleTemplatesCommand(chatId: number): Promise<void> {
  const templatesList = `<b>📋 SOFIA Template Library - 43 Available Templates</b>

<b>🏢 REGISTRATION TEMPLATES (1-8)</b>
<b>1.</b> Standard Seller Registration
<b>2.</b> Seller with Marketing Agreement
<b>3.</b> Rental Property Registration
<b>4.</b> Advanced Seller Registration
<b>5.</b> Bank Property Registration
<b>6.</b> Bank Land Registration
<b>7.</b> Developer Registration (with viewing)
<b>8.</b> Developer Registration (no viewing)

<b>👁️ VIEWING & RESERVATIONS (9-13)</b>
<b>9.</b> Standard Viewing Form
<b>10.</b> Advanced Viewing Form
<b>11.</b> Multiple Persons Viewing Form
<b>12.</b> Property Reservation Form
<b>13.</b> Property Reservation Agreement

<b>📢 MARKETING AGREEMENTS (14-16)</b>
<b>14.</b> Email Marketing Agreement
<b>15.</b> Non-Exclusive Marketing Agreement
<b>16.</b> Exclusive Marketing Agreement

<b>📧 CLIENT COMMUNICATIONS (17-33)</b>
<b>17.</b> Good Client Request - Email
<b>18.</b> Good Client Request - WhatsApp
<b>19.</b> Valuation Quote
<b>20.</b> Valuation Request Received
<b>21.</b> Client Not Providing Phone
<b>22.</b> Follow-up Multiple Properties
<b>23.</b> Follow-up Single Property
<b>24.</b> Buyer Viewing Confirmation
<b>25.</b> No Options - Low Budget
<b>26.</b> Multiple Areas Issue
<b>27.</b> Time Wasters Polite Decline
<b>28.</b> Still Looking Follow-up
<b>29.</b> No Agent Cooperation
<b>30.</b> AML/KYC Record Keeping
<b>31.</b> Selling Request Received
<b>32.</b> Recommended Pricing Advice
<b>33.</b> Overpriced Property Decline

<b>📨 EXTENDED COMMUNICATIONS (39-43)</b>
<b>39.</b> Property Location Info Request
<b>40.</b> Different Regions Request
<b>41.</b> Client Follow-up (No Reply)
<b>42.</b> Plain Request to info@zyprus
<b>43.</b> Apology for Extended Delay

<b>💡 How to use:</b>
Simply tell me what you need! For example:
• "I need a seller registration"
• "Create template 7 for Maria"
• "Developer registration with viewing tomorrow at 15:00"
• "Bank property registration"

I'll ask for any missing information and generate the document instantly! 🚀`;

  await sendTelegramMessage(chatId, templatesList);
}

/**
 * Handle /help command - Show available commands and usage
 */
async function handleHelpCommand(chatId: number): Promise<void> {
  const helpText = `<b>🤖 SOFIA - Zyprus Property Group AI Assistant</b>

<b>Available Commands:</b>
/templates - View all 43 available templates
/help - Show this help message
/start - Welcome message

<b>What I can do:</b>
🏠 Generate property registration documents
📋 Create viewing forms and agreements
💰 Calculate transfer fees, VAT, and capital gains
📧 Draft professional client communications
🏢 Handle developer & bank registrations

<b>How to use me:</b>
Simply type what you need in plain language!

<b>Examples:</b>
• "Calculate VAT on €350,000"
• "Transfer fees for a property worth €500,000"
• "Create a seller registration for John Smith"
• "Developer registration with viewing tomorrow at 15:00"

<b>Tips:</b>
• I understand natural language - just chat normally!
• For documents, I'll ask for any missing information
• All generated documents are now in <b>bold text</b> format
• I work 24/7 to assist you! 🌟

Need help? Just ask! I'm here to make your real estate work easier. 💼`;

  await sendTelegramMessage(chatId, helpText);
}
