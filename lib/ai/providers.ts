import { mistral } from "@ai-sdk/mistral";
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
          "chat-model": mistralMediumModel,
          "chat-model-small": mistralSmallModel,
          "chat-model-medium": mistralMediumModel,
          "chat-model-large": mistralLargeModel,
          "chat-model-code": codestralModel,
          "chat-model-flagship": pixtralLargeModel,
          "title-model": mistralSmallModel,
          "artifact-model": mistralLargeModel,
        },
      });
    })()
  : customProvider({
      languageModels: {
        "chat-model-small": mistral("mistral-small-latest"),
        "chat-model-medium": mistral("mistral-medium-latest"),
        "chat-model-large": wrapLanguageModel({
          model: mistral("mistral-large-latest"),
          middleware: extractReasoningMiddleware({ tagName: "think" }),
        }),
        "chat-model-code": mistral("codestral-latest"),
        "chat-model-flagship": mistral("pixtral-large-latest"),
        "chat-model": wrapLanguageModel({
          model: mistral("mistral-medium-latest"),
          middleware: extractReasoningMiddleware({ tagName: "think" }),
        }),
        "chat-model-reasoning": wrapLanguageModel({
          model: mistral("mistral-large-latest"),
          middleware: extractReasoningMiddleware({ tagName: "think" }),
        }),
        "title-model": mistral("mistral-small-latest"),
        "artifact-model": mistral("mistral-large-latest"),
      },
    });
