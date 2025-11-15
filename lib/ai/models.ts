export const DEFAULT_CHAT_MODEL: string = "chat-model"; // Gemini 2.0 Flash (default)

export type ChatModel = {
  id: string;
  name: string;
  description: string;
};

export const chatModels: ChatModel[] = [
  {
    id: "chat-model",
    name: "Gemini 2.0 Flash",
    description:
      "Google's latest and fastest multimodal model - FREE, no API Gateway needed (Default)",
  },
  {
    id: "chat-model-gemini-pro",
    name: "Gemini Pro 2.5",
    description:
      "Google's most capable model with advanced reasoning - FREE, no API Gateway needed",
  },
  {
    id: "chat-model-haiku",
    name: "Claude Haiku 4.5",
    description:
      "Anthropic's fast model with improved capabilities - $1/M in, $5/M out (requires AI Gateway)",
  },
  {
    id: "chat-model-sonnet",
    name: "Claude Sonnet 4.5",
    description:
      "Anthropic's most intelligent model with extended thinking - $3/M in, $15/M out (requires AI Gateway)",
  },
];
