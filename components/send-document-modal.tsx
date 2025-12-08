"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SendDocumentForm } from "./send-document-form";

type SendDocumentModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentTitle: string;
  documentUrl: string;
  documentContent?: string;
  chatId?: string;
};

export function SendDocumentModal({
  open,
  onOpenChange,
  documentTitle,
  documentUrl,
  documentContent,
  chatId,
}: SendDocumentModalProps) {
  const handleSuccess = () => {
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <svg
              className="size-5 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
              />
            </svg>
            Send Document
          </DialogTitle>
          <DialogDescription>
            Send this document via email, WhatsApp, or download it directly.
          </DialogDescription>
        </DialogHeader>

        <SendDocumentForm
          chatId={chatId}
          documentContent={documentContent}
          documentTitle={documentTitle}
          documentUrl={documentUrl}
          onCancel={handleCancel}
          onSuccess={handleSuccess}
        />
      </DialogContent>
    </Dialog>
  );
}

/**
 * Inline Send Document Panel
 * Alternative to modal - can be embedded directly in chat
 */
export function SendDocumentPanel({
  documentTitle,
  documentUrl,
  documentContent,
  chatId,
  onClose,
}: {
  documentTitle: string;
  documentUrl: string;
  documentContent?: string;
  chatId?: string;
  onClose?: () => void;
}) {
  return (
    <AnimatePresence>
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border bg-card p-4 shadow-lg"
        exit={{ opacity: 0, y: -10 }}
        initial={{ opacity: 0, y: 10 }}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold">Send Document</h3>
          {onClose && (
            <Button onClick={onClose} size="icon" variant="ghost">
              <X className="size-4" />
            </Button>
          )}
        </div>

        <SendDocumentForm
          chatId={chatId}
          documentContent={documentContent}
          documentTitle={documentTitle}
          documentUrl={documentUrl}
          onCancel={onClose}
          onSuccess={onClose}
        />
      </motion.div>
    </AnimatePresence>
  );
}
