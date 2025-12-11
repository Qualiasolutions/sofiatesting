/**
 * Enhanced WhatsApp Message Handler with Interactive Features
 */

import { getWhatsAppClient } from "./client";
import {
  parseWhatsAppCommand,
  getHelpMenu,
  getCalculatorMenu,
  getListingTypeMenu,
} from "./command-parser";
import {
  getSession,
  updateSession,
  handleMenuSelection,
  getListingProgress,
  clearSession,
} from "./session-manager";
import {
  formatTemplateMenu,
  getTemplate,
  shouldSendAsDocument,
  getTemplatePrompt,
  getQuickTemplateList,
  getListingWorkflowStep,
} from "./template-manager";
import { generateDocx } from "./docx-generator";
import type { WaSenderMessageData } from "./types";

/**
 * Handle WhatsApp message with enhanced features
 */
export async function handleEnhancedWhatsAppMessage(
  messageData: WaSenderMessageData
): Promise<void> {
  const client = getWhatsAppClient();
  const phoneNumber = messageData.from;
  const userMessage = messageData.text || "";

  // Parse command/menu selection
  const parsed = parseWhatsAppCommand(userMessage);
  const session = getSession(phoneNumber);

  try {
    // Handle commands first
    if (parsed.type === "command") {
      await handleCommand(phoneNumber, parsed.command || "", parsed.args || []);
      return;
    }

    // Handle menu selections
    if (parsed.type === "menu_selection" && parsed.selection) {
      const action = handleMenuSelection(phoneNumber, parsed.selection);

      if (action) {
        await executeAction(phoneNumber, action);
        return;
      }
    }

    // Handle ongoing workflows (listing upload, etc.)
    if (session.currentMenu === "listing" && session.listingData) {
      await handleListingWorkflow(phoneNumber, userMessage);
      return;
    }

    // Default: Process as regular message with AI
    // But suggest commands if the message seems like it wants help
    const lowerMessage = userMessage.toLowerCase();
    if (
      lowerMessage.includes("help") ||
      lowerMessage.includes("menu") ||
      lowerMessage === "hi" ||
      lowerMessage === "hello"
    ) {
      await client.sendMessage({
        to: phoneNumber,
        text: getHelpMenu(),
      });
      return;
    }

    // Process with AI (your existing handler)
    await processWithAI(phoneNumber, userMessage);
  } catch (error) {
    console.error("Error in enhanced handler:", error);
    await client.sendMessage({
      to: phoneNumber,
      text: "Sorry, I encountered an error. Type 'help' to see available options.",
    });
  }
}

/**
 * Handle slash commands
 */
async function handleCommand(
  phoneNumber: string,
  command: string,
  args: string[]
): Promise<void> {
  const client = getWhatsAppClient();

  switch (command) {
    case "help":
    case "?":
    case "menu":
      await client.sendMessage({
        to: phoneNumber,
        text: getHelpMenu(),
      });
      break;

    case "templates":
    case "docs":
    case "documents":
      updateSession(phoneNumber, { currentMenu: "templates" });
      await client.sendMessage({
        to: phoneNumber,
        text: formatTemplateMenu(),
      });
      break;

    case "listing":
    case "upload":
    case "property":
      updateSession(phoneNumber, { currentMenu: "listing_type" });
      await client.sendMessage({
        to: phoneNumber,
        text: getListingTypeMenu(),
      });
      break;

    case "calculator":
    case "calc":
      updateSession(phoneNumber, { currentMenu: "calculator" });
      await client.sendMessage({
        to: phoneNumber,
        text: getCalculatorMenu(),
      });
      break;

    case "status":
    case "my":
    case "listings":
      await showListingsStatus(phoneNumber);
      break;

    case "clear":
    case "reset":
      clearSession(phoneNumber);
      await client.sendMessage({
        to: phoneNumber,
        text: "Session cleared. Type 'help' to start fresh.",
      });
      break;

    case "quick":
      await client.sendMessage({
        to: phoneNumber,
        text: getQuickTemplateList(),
      });
      break;

    default:
      await client.sendMessage({
        to: phoneNumber,
        text: `Unknown command: ${command}\n\nType 'help' to see available commands.`,
      });
  }
}

/**
 * Execute menu action
 */
async function executeAction(
  phoneNumber: string,
  action: { action: string; data?: any }
): Promise<void> {
  const client = getWhatsAppClient();

  switch (action.action) {
    case "show_templates":
      await client.sendMessage({
        to: phoneNumber,
        text: formatTemplateMenu(),
      });
      break;

    case "show_calculators":
      await client.sendMessage({
        to: phoneNumber,
        text: getCalculatorMenu(),
      });
      break;

    case "start_listing":
      await client.sendMessage({
        to: phoneNumber,
        text: getListingWorkflowStep(1),
      });
      break;

    case "continue_listing":
      updateSession(phoneNumber, { currentMenu: "listing" });
      await client.sendMessage({
        to: phoneNumber,
        text: getListingWorkflowStep(2, action.data?.type),
      });
      break;

    case "generate_document":
    case "generate_email_template":
      const template = action.data?.template;
      if (template) {
        await generateTemplate(phoneNumber, template);
      }
      break;

    case "start_calculator":
      const calcType = action.data?.type;
      if (calcType) {
        await startCalculator(phoneNumber, calcType);
      }
      break;

    case "show_status":
      await showListingsStatus(phoneNumber);
      break;

    default:
      await client.sendMessage({
        to: phoneNumber,
        text: "Processing your request...",
      });
  }
}

/**
 * Generate template (document or email)
 */
async function generateTemplate(
  phoneNumber: string,
  templateId: string
): Promise<void> {
  const client = getWhatsAppClient();
  const template = getTemplate(templateId);

  if (!template) {
    await client.sendMessage({
      to: phoneNumber,
      text: "Template not found. Type 'templates' to see available options.",
    });
    return;
  }

  // Get the prompt for AI generation
  const prompt = getTemplatePrompt(templateId);

  // For now, send a message explaining what would happen
  // In production, this would call your AI to generate the actual template
  if (template.deliveryMethod === "document") {
    await client.sendMessage({
      to: phoneNumber,
      text: `📄 *Generating ${template.name}*\n\nI'll need some information to complete this document:\n\n${prompt}\n\nPlease provide the required details.`,
    });
  } else {
    await client.sendMessage({
      to: phoneNumber,
      text: `✉️ *Preparing ${template.name}*\n\nI'll create an email template for you.\n\n${prompt}\n\nPlease provide any specific details you'd like to include.`,
    });
  }

  // Store pending template generation in session
  updateSession(phoneNumber, {
    pendingAction: {
      type: "generate_template",
      data: { templateId },
    },
  });
}

/**
 * Start calculator workflow
 */
async function startCalculator(
  phoneNumber: string,
  calcType: string
): Promise<void> {
  const client = getWhatsAppClient();

  const prompts = {
    vat: "🧮 *VAT Calculator*\n\nPlease provide:\n- Property price (EUR)\n- Property size (sqm)\n- Is it your main residence? (yes/no)",
    transfer_fees: "🧮 *Transfer Fees Calculator*\n\nPlease provide:\n- Property price (EUR)\n- Is it in joint names? (yes/no)",
    capital_gains: "🧮 *Capital Gains Calculator*\n\nFor accurate calculation, please visit:\nhttps://www.zyprus.com/capital-gains-calculator\n\nOr provide your selling price and I'll give you an estimate.",
  };

  const prompt = prompts[calcType as keyof typeof prompts];
  if (prompt) {
    await client.sendMessage({
      to: phoneNumber,
      text: prompt,
    });

    updateSession(phoneNumber, {
      pendingAction: {
        type: "calculator",
        data: { calcType },
      },
    });
  }
}

/**
 * Handle listing workflow steps
 */
async function handleListingWorkflow(
  phoneNumber: string,
  userMessage: string
): Promise<void> {
  const client = getWhatsAppClient();
  const session = getSession(phoneNumber);
  const listingData = session.listingData || {};

  // Determine what field we're collecting
  if (!listingData.location) {
    updateSession(phoneNumber, {
      listingData: { ...listingData, location: userMessage },
    });
    await client.sendMessage({
      to: phoneNumber,
      text: getListingWorkflowStep(3),
    });
  } else if (!listingData.price) {
    const price = userMessage.replace(/[€,]/g, "").trim();
    updateSession(phoneNumber, {
      listingData: { ...listingData, price },
    });
    await client.sendMessage({
      to: phoneNumber,
      text: getListingWorkflowStep(4, listingData.type),
    });
  } else if (!listingData.size) {
    // Parse the specifications message
    const lines = userMessage.split("\n");
    const updates: any = {};

    for (const line of lines) {
      const lower = line.toLowerCase();
      if (lower.includes("size") || lower.includes("sqm")) {
        const match = line.match(/\d+/);
        if (match) updates.size = match[0];
      }
      if (lower.includes("bedroom")) {
        const match = line.match(/\d+/);
        if (match) updates.bedrooms = parseInt(match[0]);
      }
      if (lower.includes("bathroom")) {
        const match = line.match(/\d+/);
        if (match) updates.bathrooms = parseInt(match[0]);
      }
    }

    updateSession(phoneNumber, {
      listingData: { ...listingData, ...updates },
    });
    await client.sendMessage({
      to: phoneNumber,
      text: getListingWorkflowStep(5),
    });
  } else {
    // Continue with remaining steps...
    await client.sendMessage({
      to: phoneNumber,
      text: getListingProgress(phoneNumber),
    });
  }
}

/**
 * Show user's listings status
 */
async function showListingsStatus(phoneNumber: string): Promise<void> {
  const client = getWhatsAppClient();

  // In production, this would query the database
  await client.sendMessage({
    to: phoneNumber,
    text: "📊 *Your Listings Status*\n\nNo active listings found.\n\nType 'listing' to upload a new property.",
  });
}

/**
 * Process message with AI (fallback to existing handler)
 */
async function processWithAI(
  phoneNumber: string,
  userMessage: string
): Promise<void> {
  // Import and call your existing handleWhatsAppMessage
  const { handleWhatsAppMessage } = await import("./message-handler");

  await handleWhatsAppMessage({
    id: Date.now().toString(),
    from: phoneNumber,
    to: "",
    type: "text",
    text: userMessage,
    timestamp: Date.now(),
    isGroup: false,
  });
}