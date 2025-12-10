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
 * Simplified type for incoming messages processed by our handler
 */
export type WaSenderMessageData = {
  id: string;
  from: string;
  to: string;
  type:
    | "text"
    | "image"
    | "document"
    | "audio"
    | "video"
    | "location"
    | "vcard";
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
 * Combines legacy event names with SDK standard event types
 */
export type WaSenderWebhookEvent =
  // Legacy/custom event names
  | "message"
  | "message.sent"
  | "message.status"
  | "session.status"
  | "contact.upsert"
  | "group.update"
  | "call"
  | "webhook.test"
  // SDK standard event types (wasenderapi)
  | "messages.upsert"
  | "messages.received"
  | "messages.update"
  | "messages.delete"
  | "messages.reaction"
  | "message-receipt.update"
  | "chats.upsert"
  | "chats.update"
  | "chats.delete"
  | "contacts.upsert"
  | "contacts.update"
  | "groups.upsert"
  | "groups.update"
  | "group-participants.update"
  | "qrcode.updated";

/**
 * WaSender Webhook Payload (Legacy format)
 * Note: SDK uses 'type' field, legacy uses 'event' field
 */
export type WaSenderWebhookPayload = {
  event?: WaSenderWebhookEvent;
  type?: WaSenderWebhookEvent;
  sessionId?: string;
  timestamp?: number;
  data:
    | WaSenderMessageData
    | WaSenderStatusData
    | WaSenderSessionData
    | unknown;
};

/**
 * Message Status Update
 */
export type WaSenderStatusData = {
  id: string;
  status:
    | "sent"
    | "delivered"
    | "read"
    | "failed"
    | "pending"
    | "played"
    | "error";
  timestamp: number;
  error?: string;
};

/**
 * Session Status Update
 */
export type WaSenderSessionData = {
  status:
    | "connected"
    | "disconnected"
    | "connecting"
    | "qr_ready"
    | "error"
    | "logged_out"
    | "need_scan";
  qrCode?: string;
  qr?: string; // SDK uses 'qr' field
  reason?: string;
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
