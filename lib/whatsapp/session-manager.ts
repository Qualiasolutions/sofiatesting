/**
 * WhatsApp Session Manager
 * Tracks user conversation state and menu context
 */

export type SessionState = {
  currentMenu?: "main" | "templates" | "calculator" | "listing" | "listing_type";
  lastMenuSent?: string;
  listingData?: Partial<{
    type: string;
    location: string;
    price: string;
    bedrooms: number;
    bathrooms: number;
    size: string;
    // ... other fields
  }>;
  pendingAction?: {
    type: string;
    data?: any;
  };
  lastActivity: number;
};

// In-memory session storage (consider Redis for production)
const sessions = new Map<string, SessionState>();
const SESSION_TTL = 30 * 60 * 1000; // 30 minutes

/**
 * Get or create session for a phone number
 */
export function getSession(phoneNumber: string): SessionState {
  cleanupOldSessions();

  const existing = sessions.get(phoneNumber);
  if (existing) {
    existing.lastActivity = Date.now();
    return existing;
  }

  const newSession: SessionState = {
    lastActivity: Date.now(),
  };
  sessions.set(phoneNumber, newSession);
  return newSession;
}

/**
 * Update session state
 */
export function updateSession(
  phoneNumber: string,
  updates: Partial<SessionState>
): void {
  const session = getSession(phoneNumber);
  Object.assign(session, updates, { lastActivity: Date.now() });
  sessions.set(phoneNumber, session);
}

/**
 * Clear session
 */
export function clearSession(phoneNumber: string): void {
  sessions.delete(phoneNumber);
}

/**
 * Clean up expired sessions
 */
function cleanupOldSessions(): void {
  const now = Date.now();
  for (const [phone, session] of sessions.entries()) {
    if (now - session.lastActivity > SESSION_TTL) {
      sessions.delete(phone);
    }
  }
}

/**
 * Handle menu selection based on current context
 */
export function handleMenuSelection(
  phoneNumber: string,
  selection: number
): { action: string; data?: any } | null {
  const session = getSession(phoneNumber);

  if (!session.currentMenu) {
    // Main menu selection
    switch (selection) {
      case 1:
        updateSession(phoneNumber, { currentMenu: "templates" });
        return { action: "show_templates" };
      case 2:
        updateSession(phoneNumber, { currentMenu: "listing" });
        return { action: "start_listing" };
      case 3:
        updateSession(phoneNumber, { currentMenu: "calculator" });
        return { action: "show_calculators" };
      case 4:
        return { action: "show_status" };
      default:
        return null;
    }
  }

  switch (session.currentMenu) {
    case "templates":
      return handleTemplateSelection(phoneNumber, selection);
    case "calculator":
      return handleCalculatorSelection(phoneNumber, selection);
    case "listing_type":
      return handleListingTypeSelection(phoneNumber, selection);
    default:
      return null;
  }
}

/**
 * Handle template menu selection
 */
function handleTemplateSelection(
  phoneNumber: string,
  selection: number
): { action: string; data?: any } | null {
  const templates = [
    "seller_registration",
    "bank_registration",
    "viewing_form",
    "marketing_agreement",
    "followup_email",
    "valuation_email",
    "offer_submission",
    "other",
  ];

  if (selection < 1 || selection > templates.length) {
    return null;
  }

  const templateId = templates[selection - 1];

  if (templateId === "other") {
    // Show extended template list
    return { action: "show_more_templates" };
  }

  // Check if it's an email template (text) or document (DOCX)
  const emailTemplates = [
    "followup_email",
    "valuation_email",
    "offer_submission",
  ];

  const isEmail = emailTemplates.includes(templateId);

  clearSession(phoneNumber); // Reset after selection
  return {
    action: isEmail ? "generate_email_template" : "generate_document",
    data: { template: templateId },
  };
}

/**
 * Handle calculator menu selection
 */
function handleCalculatorSelection(
  phoneNumber: string,
  selection: number
): { action: string; data?: any } | null {
  const calculators = ["vat", "transfer_fees", "capital_gains"];

  if (selection < 1 || selection > calculators.length) {
    return null;
  }

  const calcType = calculators[selection - 1];
  clearSession(phoneNumber);

  return {
    action: "start_calculator",
    data: { type: calcType },
  };
}

/**
 * Handle listing type selection
 */
function handleListingTypeSelection(
  phoneNumber: string,
  selection: number
): { action: string; data?: any } | null {
  const types = ["apartment", "house", "land", "commercial"];

  if (selection < 1 || selection > types.length) {
    return null;
  }

  const propertyType = types[selection - 1];
  updateSession(phoneNumber, {
    listingData: { type: propertyType },
    currentMenu: "listing",
  });

  return {
    action: "continue_listing",
    data: { type: propertyType },
  };
}

/**
 * Build listing progress message
 */
export function getListingProgress(phoneNumber: string): string {
  const session = getSession(phoneNumber);
  const data = session.listingData || {};

  const required = [
    { field: "type", label: "Property Type", value: data.type },
    { field: "location", label: "Location", value: data.location },
    { field: "price", label: "Price", value: data.price },
    { field: "size", label: "Size (sqm)", value: data.size },
    { field: "bedrooms", label: "Bedrooms", value: data.bedrooms },
    { field: "bathrooms", label: "Bathrooms", value: data.bathrooms },
  ];

  let message = "📋 *Property Listing Progress*\n\n";
  let nextNeeded: string | null = null;

  for (const field of required) {
    if (field.value) {
      message += `✅ ${field.label}: ${field.value}\n`;
    } else {
      message += `⏳ ${field.label}: _needed_\n`;
      if (!nextNeeded) {
        nextNeeded = field.label;
      }
    }
  }

  if (nextNeeded) {
    message += `\n*Please provide the ${nextNeeded}:*`;
  } else {
    message += "\n✨ *All basic info collected!*\nNow I need:\n";
    message += "- Swimming pool (yes/no/communal)\n";
    message += "- Parking (yes/no)\n";
    message += "- Air conditioning (yes/no)\n";
    message += "- Owner name & phone\n";
  }

  return message;
}