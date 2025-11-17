export const DEFAULT_CHAT_MODEL: string = "chat-model"; // Gemini 2.5 Flash (default)

export type ChatModel = {
  id: string;
  name: string;
  description: string;
};

export const chatModels: ChatModel[] = [
  {
    id: "chat-model",
    name: "Gemini 2.5 Flash",
    description:
      "Google's best price-performance model with thinking - Fast, intelligent, cost-effective (Default)",
  },
  {
    id: "chat-model-pro",
    name: "Gemini 2.5 Pro",
    description:
      "Google's most powerful reasoning model - Extended context, advanced thinking, best for complex tasks",
  },
  {
    id: "chat-model-flash-lite",
    name: "Gemini 2.5 Flash-Lite",
    description:
      "Google's ultra-fast and cost-efficient model - Optimized for high throughput and simple tasks",
  },
];