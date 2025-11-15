export const DEFAULT_CHAT_MODEL: string = "chat-model"; // Claude Haiku 4.5 (default)

export type ChatModel = {
  id: string;
  name: string;
  description: string;
};

export const chatModels: ChatModel[] = [
  {
    id: "chat-model",
    name: "Claude Haiku 4.5",
    description:
      "Anthropic's fast and smart model - $1/M in, $5/M out (Default - AI Gateway)",
  },
  {
    id: "chat-model-sonnet",
    name: "Claude Sonnet 4.5",
    description:
      "Anthropic's most intelligent model with extended thinking - $3/M in, $15/M out (AI Gateway)",
  },
  {
    id: "chat-model-gpt4o",
    name: "GPT-4o Mini",
    description:
      "OpenAI's ultra-cheap model - $0.15/M in, $0.60/M out (AI Gateway)",
  },
  {
    id: "chat-model-gemini-flash",
    name: "Gemini 2.0 Flash",
    description:
      "Google's experimental fast model - Multimodal and cost-effective (Direct API)",
  },
  {
    id: "chat-model-gemini-pro",
    name: "Gemini 2.5 Pro",
    description:
      "Google's powerful reasoning model - Extended context and multimodal (Direct API)",
  },
];
