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
      "Best price-performance with thinking • $0.075/M input, $0.30/M output (Default)",
  },
  {
    id: "chat-model-pro",
    name: "Gemini 2.5 Pro",
    description:
      "Most powerful reasoning model • $1.25/M input, $5.00/M output",
  },
  {
    id: "chat-model-flash-lite",
    name: "Gemini 2.5 Flash-Lite",
    description:
      "Ultra-fast and cheapest • $0.0375/M input, $0.15/M output",
  },
];