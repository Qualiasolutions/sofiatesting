export const DEFAULT_CHAT_MODEL: string = "chat-model"; // Gemini 1.5 Flash (default)

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
      "Google's latest multimodal model - Fast, cost-effective, and powerful (Default)",
  },
  {
    id: "chat-model-sonnet",
    name: "Claude Sonnet 4.5",
    description:
      "Anthropic's newest and most intelligent model with extended thinking - $3/M in, $15/M out (requires AI Gateway)",
  },
  {
    id: "chat-model-haiku",
    name: "Claude Haiku 4.5",
    description:
      "Anthropic's newest fast model with improved capabilities - $0.80/M in, $4/M out (requires AI Gateway)",
  },
  {
    id: "chat-model-gpt4o",
    name: "GPT-4o",
    description:
      "OpenAI's flagship multimodal model - $2.50/M in, $10/M out (requires AI Gateway)",
  },
];
