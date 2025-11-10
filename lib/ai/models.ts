export const DEFAULT_CHAT_MODEL: string = "chat-model"; // GPT-4o Mini via AI Gateway

export type ChatModel = {
  id: string;
  name: string;
  description: string;
};

export const chatModels: ChatModel[] = [
  {
    id: "chat-model",
    name: "GPT-4o Mini",
    description:
      "Fast and affordable - $0.15/M in, $0.60/M out (via AI Gateway)",
  },
  {
    id: "chat-model-sonnet",
    name: "Claude Sonnet 4.5",
    description:
      "Anthropic's most intelligent model - $3/M in, $15/M out (requires AI Gateway)",
  },
  {
    id: "chat-model-haiku",
    name: "Claude 3.5 Haiku",
    description:
      "Anthropic's fastest model - $0.25/M in, $1.25/M out (requires AI Gateway)",
  },
  {
    id: "chat-model-gpt4o",
    name: "GPT-4o",
    description:
      "OpenAI's flagship model - $2.50/M in, $10/M out (requires AI Gateway)",
  },
  {
    id: "chat-model-gpt4o-mini",
    name: "GPT-4o Mini",
    description:
      "Fast and affordable - $0.15/M in, $0.60/M out (requires AI Gateway)",
  },
];
