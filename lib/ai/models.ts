export const DEFAULT_CHAT_MODEL: string = "chat-model-sonnet";

export type ChatModel = {
  id: string;
  name: string;
  description: string;
};

export const chatModels: ChatModel[] = [
  {
    id: "chat-model-sonnet",
    name: "Claude 3.5 Sonnet",
    description: "Anthropic's most intelligent model - $3/M in, $15/M out",
  },
  {
    id: "chat-model-gpt4o",
    name: "GPT-4o",
    description: "OpenAI's flagship multimodal model - $2.50/M in, $10/M out",
  },
  {
    id: "chat-model-gpt4o-mini",
    name: "GPT-4o Mini",
    description: "Fast and affordable - $0.15/M in, $0.60/M out",
  },
];
