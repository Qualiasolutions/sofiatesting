import type { UserType } from "@/app/(auth)/auth";
import type { ChatModel } from "./models";

type Entitlements = {
  maxMessagesPerDay: number;
  availableChatModelIds: ChatModel["id"][];
};

export const entitlementsByUserType: Record<UserType, Entitlements> = {
  /*
   * For users without an account
   */
  guest: {
    maxMessagesPerDay: 100,
    availableChatModelIds: [
      "chat-model", // Gemini 2.5 Flash (default)
      "chat-model-pro", // Gemini 2.5 Pro
      "chat-model-flash-lite", // Gemini 2.5 Flash-Lite
    ],
  },

  /*
   * For users with an account
   */
  regular: {
    maxMessagesPerDay: 10_000,
    availableChatModelIds: [
      "chat-model", // Gemini 2.5 Flash (default)
      "chat-model-pro", // Gemini 2.5 Pro
      "chat-model-flash-lite", // Gemini 2.5 Flash-Lite
    ],
  },

  /*
   * TODO: For users with an account and a paid membership
   */
};
