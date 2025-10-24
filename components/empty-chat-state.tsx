"use client";

import { motion } from "framer-motion";
import { MessageIcon, SparklesIcon, HomeIcon } from "./icons";
import { Button } from "./ui/button";
import { EmptyState } from "./ui/empty";
import Link from "next/link";

interface EmptyChatStateProps {
  user?: any;
}

export function EmptyChatState({ user }: EmptyChatStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center h-full"
    >
      <EmptyState
        icon={
          <div className="relative">
            <SparklesIcon size={48} className="text-primary" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          </div>
        }
        title="Welcome to SOFIA"
        description="Your AI-powered assistant for Cyprus real estate document generation. Start a conversation to create professional documents instantly."
        action={
          <div className="flex flex-col gap-3 w-full max-w-sm">
            <Link href="/">
              <Button className="w-full" size="lg">
                <MessageIcon size={16} className="mr-2" />
                Start New Conversation
              </Button>
            </Link>
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-2">
                Popular document types:
              </p>
              <div className="flex flex-wrap gap-1 justify-center">
                <span className="px-2 py-1 bg-muted rounded-md text-xs">Registrations</span>
                <span className="px-2 py-1 bg-muted rounded-md text-xs">Marketing</span>
                <span className="px-2 py-1 bg-muted rounded-md text-xs">Valuations</span>
                <span className="px-2 py-1 bg-muted rounded-md text-xs">Viewing Forms</span>
              </div>
            </div>
          </div>
        }
      />
    </motion.div>
  );
}