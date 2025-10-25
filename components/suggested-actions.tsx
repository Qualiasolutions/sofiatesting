"use client";

import type { UseChatHelpers } from "@ai-sdk/react";
import { motion } from "framer-motion";
import { memo } from "react";
import type { ChatMessage } from "@/lib/types";
import { Suggestion } from "./elements/suggestion";
import { FileIcon, GlobeIcon, HomeIcon, InvoiceIcon } from "./icons";
import type { VisibilityType } from "./visibility-selector";

type SuggestedActionsProps = {
  chatId: string;
  sendMessage: UseChatHelpers<ChatMessage>["sendMessage"];
  selectedVisibilityType: VisibilityType;
};

function PureSuggestedActions({ chatId, sendMessage }: SuggestedActionsProps) {
  const suggestedActions = [
    {
      text: "I NEED A REGISTRATION",
      icon: <FileIcon size={16} />,
      description: "Generate property registration documents",
    },
    {
      text: "I NEED A MARKETING",
      icon: <GlobeIcon size={16} />,
      description: "Create marketing agreements and materials",
    },
    {
      text: "I NEED A VALUATION",
      icon: <InvoiceIcon size={16} />,
      description: "Request property valuation services",
    },
    {
      text: "I NEED A VIEWING FORM",
      icon: <HomeIcon size={16} />,
      description: "Generate viewing request forms",
    },
  ];

  return (
    <div
      className="grid w-full gap-3 sm:grid-cols-2"
      data-testid="suggested-actions"
    >
      {suggestedActions.map((action, index) => (
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          initial={{ opacity: 0, y: 20 }}
          key={action.text}
          transition={{ delay: 0.05 * index }}
        >
          <Suggestion
            className="group h-auto w-full whitespace-normal border border-border/50 bg-gradient-to-br from-muted/50 to-muted p-4 text-left transition-all duration-200 hover:border-border hover:from-muted hover:to-muted/80 hover:shadow-md hover:shadow-muted/20"
            onClick={(suggestion) => {
              window.history.replaceState({}, "", `/chat/${chatId}`);
              sendMessage({
                role: "user",
                parts: [{ type: "text", text: suggestion }],
              });
            }}
            suggestion={action.text}
          >
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 rounded-lg bg-primary/10 p-2 text-primary transition-colors group-hover:bg-primary/20">
                {action.icon}
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-1 font-medium text-foreground text-sm">
                  {action.text}
                </div>
                <div className="text-muted-foreground text-xs leading-relaxed">
                  {action.description}
                </div>
              </div>
            </div>
          </Suggestion>
        </motion.div>
      ))}
    </div>
  );
}

export const SuggestedActions = memo(
  PureSuggestedActions,
  (prevProps, nextProps) => {
    if (prevProps.chatId !== nextProps.chatId) {
      return false;
    }
    if (prevProps.selectedVisibilityType !== nextProps.selectedVisibilityType) {
      return false;
    }

    return true;
  }
);
