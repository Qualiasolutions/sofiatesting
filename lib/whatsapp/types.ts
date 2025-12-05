/**
 * WhatsApp Integration Types for WaSenderAPI
 * Using official wasenderapi SDK types with custom extensions
 */

// Re-export SDK types for convenience
export type {
  WasenderAPIError,
  WasenderWebhookEvent,
} from "wasenderapi";

/**
 * WaSender Webhook Message Data
 * Simplified type for incoming messages
 */
export type WaSenderMessageData = {
  id: string;
  from: string;
  to: string;
  type: "text" | "image" | "document" | "audio" | "video" | "location" | "vcard";
  text?: string;
  timestamp: number;
  isGroup: boolean;
  groupName?: string;
  sender?: {
    id: string;
    name: string;
  };
  // Media fields (when type is not "text")
  mediaUrl?: string;
  mimetype?: string;
  filename?: string;
  caption?: string;
};

/**
 * WaSender Webhook Event Types
 */
export type WaSenderWebhookEvent =
  | "message"
  | "message.status"
  | "session.status"
  | "contact.upsert"
  | "group.update"
  | "call";

/**
 * WaSender Webhook Payload
 */
export type WaSenderWebhookPayload = {
  event: WaSenderWebhookEvent;
  sessionId?: string;
  data: WaSenderMessageData | WaSenderStatusData | WaSenderSessionData;
};

/**
 * Message Status Update
 */
export type WaSenderStatusData = {
  id: string;
  status: "sent" | "delivered" | "read" | "failed";
  timestamp: number;
  error?: string;
};

/**
 * Session Status Update
 */
export type WaSenderSessionData = {
  status: "connected" | "disconnected" | "connecting" | "qr_ready";
  qrCode?: string;
};

/**
 * Document Detection Result
 */
export type DocumentDetectionResult = {
  isForm: boolean;
  templateType: string | null;
  documentName: string;
};

/**
 * DOCX Generation Options
 */
export type DocxGenerationOptions = {
  content: string;
  filename?: string;
  preserveBold?: boolean;
};

/**
 * WhatsApp Send Result
 */
export type WhatsAppSendResult = {
  success: boolean;
  messageId?: string;
  error?: string;
};
