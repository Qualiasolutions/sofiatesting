"use client";

import { Copy, Download, ExternalLink, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SendDocumentModal } from "./send-document-modal";

type DocumentActionsProps = {
  documentTitle: string;
  documentUrl: string;
  documentContent?: string;
  chatId?: string;
  variant?: "inline" | "dropdown";
  size?: "sm" | "default";
};

export function DocumentActions({
  documentTitle,
  documentUrl,
  documentContent,
  chatId,
  variant = "inline",
  size = "sm",
}: DocumentActionsProps) {
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      const response = await fetch(documentUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = documentTitle.endsWith(".docx")
        ? documentTitle
        : `${documentTitle}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Document downloaded");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download document");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(documentUrl);
      toast.success("Link copied to clipboard");
    } catch (error) {
      console.error("Copy error:", error);
      toast.error("Failed to copy link");
    }
  };

  const handleOpenInNewTab = () => {
    window.open(documentUrl, "_blank");
  };

  if (variant === "dropdown") {
    return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              className="gap-2"
              size={size === "sm" ? "sm" : "default"}
              variant="outline"
            >
              <Send className="size-4" />
              Actions
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setSendModalOpen(true)}>
              <Send className="mr-2 size-4" />
              Send Document
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDownload}>
              <Download className="mr-2 size-4" />
              Download
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleCopyLink}>
              <Copy className="mr-2 size-4" />
              Copy Link
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleOpenInNewTab}>
              <ExternalLink className="mr-2 size-4" />
              Open in New Tab
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <SendDocumentModal
          chatId={chatId}
          documentContent={documentContent}
          documentTitle={documentTitle}
          documentUrl={documentUrl}
          onOpenChange={setSendModalOpen}
          open={sendModalOpen}
        />
      </>
    );
  }

  // Inline variant
  return (
    <>
      <TooltipProvider>
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                className="size-8"
                onClick={() => setSendModalOpen(true)}
                size="icon"
                variant="ghost"
              >
                <Send className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Send Document</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                className="size-8"
                disabled={isDownloading}
                onClick={handleDownload}
                size="icon"
                variant="ghost"
              >
                <Download className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Download</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                className="size-8"
                onClick={handleCopyLink}
                size="icon"
                variant="ghost"
              >
                <Copy className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Copy Link</TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>

      <SendDocumentModal
        chatId={chatId}
        documentContent={documentContent}
        documentTitle={documentTitle}
        documentUrl={documentUrl}
        onOpenChange={setSendModalOpen}
        open={sendModalOpen}
      />
    </>
  );
}
