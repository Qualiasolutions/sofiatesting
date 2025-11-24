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

  // Handle bot commands
  const command = message.text.split(" ")[0].toLowerCase();

  switch (command) {
    case "/start":
      await handleStartCommand(chatId, message.from.first_name);
      return;
    case "/help":
      await handleHelpCommand(chatId);
      return;
    case "/templates":
    case "/template":
      await handleTemplatesCommand(chatId);
      return;
    case "/vat":
      await handleVATCommand(chatId);
      return;
    case "/transfer":
      await handleTransferCommand(chatId);
      return;
    case "/capitalgains":
      await handleCapitalGainsCommand(chatId);
      return;
    case "/examples":
      await handleExamplesCommand(chatId);
      return;
    case "/clear":
      await handleClearCommand(chatId, message.from.id);
      return;
    case "/about":
      await handleAboutCommand(chatId);
      return;
  }

  // Get the model once for use in both streaming and error logging
  const chatModel = myProvider.languageModel("chat-model");

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
          model: chatModel, // Use Gemini 2.5 Flash for Telegram (reliable & fast)
          system: await systemPrompt({
            selectedChatModel: "chat-model",
            requestHints: {
              latitude: undefined,
              longitude: undefined,
              city: undefined,
              country: "Cyprus", // Default to Cyprus for SOFIA
            },
            userMessage: message.text,
          }),
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
      modelName: chatModel.modelId, // Log the actual model being used
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
  const templatesList = `📋 SOFIA Template Library - 43 Available Templates

🏢 REGISTRATION TEMPLATES (1-8)
1. Standard Seller Registration
2. Seller with Marketing Agreement
3. Rental Property Registration
4. Advanced Seller Registration
5. Bank Property Registration
6. Bank Land Registration
7. Developer Registration (with viewing)
8. Developer Registration (no viewing)

👁️ VIEWING & RESERVATIONS (9-13)
9. Standard Viewing Form
10. Advanced Viewing Form
11. Multiple Persons Viewing Form
12. Property Reservation Form
13. Property Reservation Agreement

📢 MARKETING AGREEMENTS (14-16)
14. Email Marketing Agreement
15. Non-Exclusive Marketing Agreement
16. Exclusive Marketing Agreement

📧 CLIENT COMMUNICATIONS (17-33)
17. Good Client Request - Email
18. Good Client Request - WhatsApp
19. Valuation Quote
20. Valuation Request Received
21. Client Not Providing Phone
22. Follow-up Multiple Properties
23. Follow-up Single Property
24. Buyer Viewing Confirmation
25. No Options - Low Budget
26. Multiple Areas Issue
27. Time Wasters Polite Decline
28. Still Looking Follow-up
29. No Agent Cooperation
30. AML/KYC Record Keeping
31. Selling Request Received
32. Recommended Pricing Advice
33. Overpriced Property Decline

📨 EXTENDED COMMUNICATIONS (39-43)
39. Property Location Info Request
40. Different Regions Request
41. Client Follow-up (No Reply)
42. Plain Request to info@zyprus
43. Apology for Extended Delay

Usage:
• "seller registration"
• "template 7 for Maria"
• "developer registration with viewing tomorrow at 15:00"
• "bank property registration"`;

  await sendTelegramMessage(chatId, templatesList);
}

/**
 * Handle /start command - Welcome message with quick start
 */
async function handleStartCommand(
  chatId: number,
  firstName: string
): Promise<void> {
  const startText = `Welcome ${firstName}! I'm SOFIA, your Cyprus Real Estate AI Assistant.

I help with:
- Property tax calculations (VAT, transfer fees, capital gains)
- Document templates for real estate transactions
- Cyprus property market information

Quick Start:
Just type your question naturally, like:
"Calculate VAT for a €400,000 apartment"
"Transfer fees for €250,000 property"

Or use /help to see all commands.

How can I assist you today?`;

  await sendTelegramMessage(chatId, startText);
}

/**
 * Handle /help command - Show available commands and usage
 */
async function handleHelpCommand(chatId: number): Promise<void> {
  const helpText = `SOFIA - Cyprus Real Estate AI Assistant

COMMANDS:
/vat - Calculate VAT for new properties
/transfer - Calculate property transfer fees
/capitalgains - Calculate capital gains tax
/templates - Browse 43 document templates
/examples - See example questions
/clear - Start fresh conversation
/about - About SOFIA

CALCULATORS:
Just ask naturally:
"VAT for €350,000 apartment, 120sqm"
"Transfer fees for €500,000"
"Capital gains: bought €200k in 2015, selling €350k"

DOCUMENTS:
"Seller registration for John Smith"
"Viewing form for tomorrow at 3pm"
"Marketing agreement for Villa Costa"

Need help? Just type your question!`;

  await sendTelegramMessage(chatId, helpText);
}

/**
 * Handle /vat command - VAT calculator guide
 */
async function handleVATCommand(chatId: number): Promise<void> {
  const vatText = `VAT Calculator for Cyprus Properties

VAT applies to NEW properties only (not resale).

RATES:
- 5% reduced rate: Primary residence, first 130sqm, up to €350k
- 19% standard rate: Investment properties or excess

REQUIRED INFO:
1. Property price (€)
2. Total area (sqm)
3. Main residence? (yes/no)

EXAMPLES:
"Calculate VAT for €300,000 apartment, 100sqm, main residence"
"VAT on €500,000 villa, 200sqm, investment property"

Just type your calculation request!`;

  await sendTelegramMessage(chatId, vatText);
}

/**
 * Handle /transfer command - Transfer fees guide
 */
async function handleTransferCommand(chatId: number): Promise<void> {
  const transferText = `Transfer Fees Calculator

Progressive rates with 50% exemption for resale:
- Up to €85,000: 3%
- €85,001 - €170,000: 5%
- Over €170,000: 8%

EXAMPLES:
"Transfer fees for €250,000 property"
"Transfer fees for €400,000 in joint names"

Joint names = fee split between 2 buyers (often saves money on higher-value properties).

Just type your calculation!`;

  await sendTelegramMessage(chatId, transferText);
}

/**
 * Handle /capitalgains command - Capital gains guide
 */
async function handleCapitalGainsCommand(chatId: number): Promise<void> {
  const cgText = `Capital Gains Tax Calculator

TAX RATE: 20% on profit above allowance

ALLOWANCES:
- Main residence: €85,430
- Farm land: €25,629
- Other property: €17,086

DEDUCTIBLE COSTS:
- Purchase price (inflation adjusted)
- Improvements
- Legal fees, agent fees
- Transfer fees paid

EXAMPLE:
"Capital gains: bought for €200,000 in 2015, selling for €350,000 now, main residence"

Type your calculation with purchase & sale details!`;

  await sendTelegramMessage(chatId, cgText);
}

/**
 * Handle /examples command - Show example questions
 */
async function handleExamplesCommand(chatId: number): Promise<void> {
  const examplesText = `Example Questions for SOFIA

CALCULATIONS:
"Calculate VAT for €350,000 new apartment, 120sqm"
"What are the transfer fees for a €500,000 villa?"
"Capital gains if I bought for €180k in 2018 and sell for €280k"
"Total buying costs for €400,000 property"

DOCUMENTS:
"Create seller registration for Maria Georgiou"
"Viewing form for 25 Poseidon St, Limassol, tomorrow 2pm"
"Marketing agreement for 3-bed apartment"
"Valuation request for villa in Paphos"

INFORMATION:
"What documents do I need to buy property in Cyprus?"
"Explain the property buying process"
"What is Title Deed vs Contract of Sale?"

Just copy any example or type your own question!`;

  await sendTelegramMessage(chatId, examplesText);
}

/**
 * Handle /clear command - Clear conversation history
 */
async function handleClearCommand(
  chatId: number,
  _telegramUserId: number
): Promise<void> {
  try {
    // Note: Full message deletion would require deleteChatMessages DB operation
    // For now, we just acknowledge the clear request

    const clearText = `Conversation cleared!

Your previous context has been reset. I'll treat our next exchange as a fresh conversation.

How can I help you today?`;

    await sendTelegramMessage(chatId, clearText);
  } catch {
    await sendTelegramMessage(
      chatId,
      "Ready for a fresh start! What would you like to know?"
    );
  }
}

/**
 * Handle /about command - About SOFIA
 */
async function handleAboutCommand(chatId: number): Promise<void> {
  const aboutText = `About SOFIA

SOFIA (Smart Operations & Facilitation Intelligence Assistant) is the AI assistant for Zyprus Property Group.

CAPABILITIES:
- Cyprus property tax calculations
- 43 real estate document templates
- Property market information
- Transaction cost estimates

ACCURACY:
Calculations follow official Cyprus tax rules:
- VAT: Cyprus Tax Department guidelines
- Transfer fees: Land Registry rates
- Capital gains: 20% tax rate with allowances

SUPPORT:
For complex queries or official advice, consult:
- Tax advisor for tax matters
- Lawyer for legal documents
- Licensed agent for property valuations

Powered by Zyprus Property Group
https://www.zyprus.com`;

  await sendTelegramMessage(chatId, aboutText);
}
