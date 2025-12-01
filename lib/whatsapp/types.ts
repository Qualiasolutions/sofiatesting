/**
 * WhatsApp Integration Types for WaSenderAPI
 * Based on WaSenderAPI documentation
 */

// WaSender Webhook Message Types
export type WaSenderWebhookMessage = {
  event: "message" | "status" | "connection";
  instanceId: string;
  data: WaSenderMessageData | WaSenderStatusData | WaSenderConnectionData;
};

export type WaSenderMessageData = {
  id: string;
  from: string;
  to: string;
  type: "text" | "image" | "document" | "audio" | "video" | "location";
  text?: string;
  timestamp: number;
  isGroup: boolean;
  groupName?: string;
  sender?: {
    id: string;
    name: string;
  };
};

export type WaSenderStatusData = {
  id: string;
  status: "sent" | "delivered" | "read" | "failed";
  timestamp: number;
};

export type WaSenderConnectionData = {
  status: "connected" | "disconnected" | "connecting";
  instanceId: string;
};

// Document detection result
export type DocumentDetectionResult = {
  isForm: boolean;
  templateType: string | null;
  documentName: string;
};

// DOCX generation options
export type DocxGenerationOptions = {
  content: string;
  filename?: string;
  preserveBold?: boolean;
};
