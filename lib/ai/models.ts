export const DEFAULT_CHAT_MODEL: string = "chat-model-small";

export type ChatModel = {
  id: string;
  name: string;
  description: string;
};

export const chatModels: ChatModel[] = [
  {
    id: "chat-model-small",
    name: "Mistral Small",
    description: "Fast and efficient - $0.6/M in, $1.8/M out",
  },
  {
    id: "chat-model-medium",
    name: "Mistral Medium 1.2",
    description: "Balanced performance - $2/M in, $6/M out",
  },
  {
    id: "chat-model-large",
    name: "Mistral Large",
    description: "High performance - $3/M in, $9/M out",
  },
  {
    id: "chat-model-code",
    name: "Codestral",
    description: "Optimized for code generation - $0.3/M in, $0.9/M out",
  },
  {
    id: "chat-model-reasoning",
    name: "Mistral Large (Reasoning)",
    description: "Advanced reasoning with thinking process - $3/M in, $9/M out",
  },
  {
    id: "chat-model-flagship",
    name: "Pixtral Large (Most Capable)",
    description: "Flagship multimodal model with vision - $8/M in, $24/M out",
  },
];
