export const DEFAULT_CHAT_MODEL: string = "chat-model"; // Gemini 3 Pro Preview (default)

export type ChatModel = {
  id: string;
  name: string;
  description: string;
};

export const chatModels: ChatModel[] = [
  {
    id: "chat-model",
    name: "Gemini 3 Pro",
    description:
      "Best reasoning & multimodal • 1M context, $2/M input, $12/M output (Default)",
  },
  {
    id: "chat-model-flash",
    name: "Gemini 2.5 Flash",
    description:
      "Fast with good quality • $0.075/M input, $0.30/M output",
  },
  {
    id: "chat-model-pro",
    name: "Gemini 2.5 Pro",
    description:
      "Previous gen reasoning model • $1.25/M input, $5.00/M output",
  },
  {
    id: "chat-model-flash-lite",
    name: "Gemini 2.5 Flash-Lite",
    description: "Ultra-fast and cheapest • $0.0375/M input, $0.15/M output",
  },
];

// Semantic Model Roles
export const ROUTER_MODEL = "chat-model-flash-lite"; // Cheap & Fast for triage
export const WORKER_MODEL = "chat-model"; // Gemini 3 Pro for general chat
export const EXPERT_MODEL = "chat-model"; // Gemini 3 Pro is now the best
