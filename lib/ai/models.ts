export const DEFAULT_CHAT_MODEL: string = "chat-model-gemini";

export type ChatModel = {
  id: string;
  name: string;
  description: string;
};

export const chatModels: ChatModel[] = [
  {
    id: "chat-model-gemini",
    name: "Gemini 2.5 Flash",
    description: "Ultra-fast and cheap - $0.30/M in, $2.50/M out",
  },
  {
    id: "chat-model-claude",
    name: "Claude 3.7 Sonnet",
    description: "Best accuracy for documents - $3/M in, $15/M out",
  },
  {
    id: "chat-model",
    name: "Grok Vision",
    description: "Multimodal with vision - $2/M in, $10/M out",
  },
  {
    id: "chat-model-reasoning",
    name: "Grok Reasoning",
    description: "Advanced reasoning - $2/M in, $10/M out",
  },
];
