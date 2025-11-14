import "server-only";
import { convertToModelMessages, streamText } from "ai";
import { systemPrompt } from "../ai/prompts";
import { myProvider } from "../ai/providers";
import { calculateCapitalGainsTool } from "../ai/tools/calculate-capital-gains";
import { calculateTransferFeesTool } from "../ai/tools/calculate-transfer-fees";
import { calculateVATTool } from "../ai/tools/calculate-vat";
import { createDocument } from "../ai/tools/create-document";
import { createListingTool } from "../ai/tools/create-listing";
import { getZyprusDataTool } from "../ai/tools/get-zyprus-data";
import { listListingsTool } from "../ai/tools/list-listings";
import { requestSuggestions } from "../ai/tools/request-suggestions";
import { updateDocument } from "../ai/tools/update-document";
import { uploadListingTool } from "../ai/tools/upload-listing";
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

    // Generate AI response
    let fullResponse = "";
    const assistantMessageId = generateUUID();

    // Create a simple data stream for document tools (Telegram doesn't need real-time streaming)
    const dataStream = {
      writeData: () => {}, // No-op for Telegram
    };

    // Mock session for document tools (user already authenticated via dbUser)
    const session = {
      user: {
        id: dbUser.id,
        email: dbUser.email,
      },
    };

    const result = await streamText({
      model: myProvider.languageModel("chat-model"), // Use Gemini Flash for Telegram (reliable & fast)
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
- Use formatting like <b>bold</b> for emphasis on important information

Remember: You're chatting on Telegram, so keep it natural and conversational while maintaining professionalism.`,
      messages: convertToModelMessages(allMessages),
      experimental_activeTools: [
        "calculateTransferFees",
        "calculateCapitalGains",
        "calculateVAT",
        "createListing",
        "listListings",
        "uploadListing",
        "getZyprusData",
        "createDocument",
        "updateDocument",
        "requestSuggestions",
      ],
      tools: {
        calculateTransferFees: calculateTransferFeesTool,
        calculateCapitalGains: calculateCapitalGainsTool,
        calculateVAT: calculateVATTool,
        createListing: createListingTool,
        listListings: listListingsTool,
        uploadListing: uploadListingTool,
        getZyprusData: getZyprusDataTool,
        createDocument: createDocument({ session, dataStream }),
        updateDocument: updateDocument({ session, dataStream }),
        requestSuggestions: requestSuggestions({ session, dataStream }),
      },
      experimental_telemetry: {
        isEnabled: isProductionEnvironment,
        functionId: "telegram-stream-text",
      },
    });

    // Collect response text
    const TYPING_INTERVAL_MS = 3000; // 3 seconds
    let lastTypingIndicator = Date.now();

    for await (const textPart of result.textStream) {
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

    // Convert markdown bold (**text**) to Telegram markdown (*text*)
    const telegramFormattedResponse = formatForTelegram(fullResponse);

    // Send response to Telegram
    await telegramClient.sendLongMessage({
      chatId,
      text: telegramFormattedResponse,
      replyToMessageId: message.message_id,
    });
  } catch (error) {
    console.error("Error handling Telegram message:", {
      chatId,
      fromUser: message.from,
      messageText: message.text?.substring(0, 100),
      error,
      errorMessage: error instanceof Error ? error.message : "Unknown error",
      errorStack: error instanceof Error ? error.stack : undefined,
    });

    try {
      await sendTelegramMessage(
        chatId,
        "Sorry, I encountered an error processing your message. Please try again later."
      );
    } catch (sendError) {
      console.error("Failed to send error message to Telegram:", {
        chatId,
        sendError:
          sendError instanceof Error ? sendError.message : "Unknown error",
      });
    }
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
  formatted = formatted.replace(/([•\-*])/g, "\n$1");

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
