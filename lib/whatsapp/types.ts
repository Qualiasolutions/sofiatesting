/**
 * WhatsApp Integration Types for WaSenderAPI
 * Based on WaSenderAPI documentation
 */

// WaSender Webhook Message Types
export interface WaSenderWebhookMessage {
  event: "message" | "status" | "connection";
  instanceId: string;
  data: WaSenderMessageData | WaSenderStatusData | WaSenderConnectionData;
}

export interface WaSenderMessageData {
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
}

export interface WaSenderStatusData {
  id: string;
  status: "sent" | "delivered" | "read" | "failed";
  timestamp: number;
}

export interface WaSenderConnectionData {
  status: "connected" | "disconnected" | "connecting";
  instanceId: string;
}

// Document detection result
export interface DocumentDetectionResult {
  isForm: boolean;
  templateType: string | null;
  documentName: string;
}

// DOCX generation options
export interface DocxGenerationOptions {
  content: string;
  filename?: string;
  preserveBold?: boolean;
}
