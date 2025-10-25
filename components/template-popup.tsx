"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { TemplateInfo } from "@/types/template";

interface TemplatePopupProps {
  template: TemplateInfo | null;
  isOpen: boolean;
  onClose: () => void;
}

export function TemplatePopup({
  template,
  isOpen,
  onClose,
}: TemplatePopupProps) {
  if (!template) return null;

  return (
    <Sheet onOpenChange={onClose} open={isOpen}>
      <SheetContent className="w-full max-w-4xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {template.name}
            <Badge className="text-xs" variant="secondary">
              {template.category}
            </Badge>
          </SheetTitle>
          <SheetDescription>
            Required fields and template example for SOFIA AI Assistant
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Required Fields Section */}
          <div>
            <h3 className="mb-4 font-semibold text-lg">Required Fields</h3>
            {template.requiredFields.length > 0 ? (
              <div className="space-y-3">
                {template.requiredFields.map((field, index) => (
                  <div
                    className="flex items-start gap-3 rounded-lg bg-muted/50 p-3"
                    key={index}
                  >
                    <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500" />
                    <div className="flex-1">
                      <div className="font-medium text-sm">{field.name}</div>
                      {field.example && (
                        <div className="mt-1 text-muted-foreground text-xs">
                          e.g., {field.example}
                        </div>
                      )}
                    </div>
                    <Badge className="text-xs" variant="outline">
                      Required
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-muted-foreground italic">
                No specific fields required for this template
              </div>
            )}
          </div>

          <Separator />

          {/* Template Example Section */}
          <div>
            <h3 className="mb-4 font-semibold text-lg">Template Example</h3>
            <ScrollArea className="h-96 w-full rounded-lg border">
              <div className="p-4">
                <pre className="whitespace-pre-wrap font-mono text-foreground text-sm">
                  {template.templateExample || "Template example not available"}
                </pre>
              </div>
            </ScrollArea>
            <div className="mt-2 text-muted-foreground text-xs">
              <strong>Note:</strong> Fields shown as [FIELD_NAME] will be
              replaced with actual values when SOFIA generates the document.
            </div>
          </div>

          {/* Usage Instructions */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/20">
            <h4 className="mb-2 font-semibold text-blue-800 text-sm dark:text-blue-200">
              How to use this template:
            </h4>
            <ol className="list-inside list-decimal space-y-1 text-blue-700 text-sm dark:text-blue-300">
              <li>Start a new chat with SOFIA</li>
              <li>Provide the required fields listed above</li>
              <li>SOFIA will automatically detect the appropriate template</li>
              <li>
                The document will be generated instantly with your information
              </li>
            </ol>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
