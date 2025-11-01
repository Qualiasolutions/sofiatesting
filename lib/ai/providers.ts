import { gateway } from "@ai-sdk/gateway";
import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from "ai";
import { isTestEnvironment } from "../constants";

export const myProvider = isTestEnvironment
  ? (() => {
      const {
        artifactModel,
        chatModel,
        reasoningModel,
        titleModel,
        geminiModel,
        claudeModel,
        mistralSmallModel,
        mistralMediumModel,
        mistralLargeModel,
        codestralModel,
        pixtralLargeModel,
      } = require("./models.mock");
      return customProvider({
        languageModels: {
          "chat-model": claudeModel,
          "chat-model-sonnet": claudeModel,
          "chat-model-gpt4o": chatModel,
          "chat-model-gpt4o-mini": mistralSmallModel,
          "title-model": mistralSmallModel,
          "artifact-model": claudeModel,
        },
      });
    })()
  : customProvider({
      languageModels: {
        "chat-model-sonnet": wrapLanguageModel({
          model: gateway("anthropic/claude-3-5-sonnet-20241022"),
          middleware: extractReasoningMiddleware({ tagName: "thinking" }),
        }),
        "chat-model-gpt4o": gateway("openai/gpt-4o"),
        "chat-model-gpt4o-mini": gateway("openai/gpt-4o-mini"),
        "chat-model": wrapLanguageModel({
          model: gateway("anthropic/claude-3-5-sonnet-20241022"),
          middleware: extractReasoningMiddleware({ tagName: "thinking" }),
        }),
        "title-model": gateway("openai/gpt-4o-mini"),
        "artifact-model": gateway("anthropic/claude-3-5-sonnet-20241022"),
      },
    });
