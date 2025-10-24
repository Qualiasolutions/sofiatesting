"use client";

import { useState } from "react";
import type { TemplateInfo } from "@/types/template";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface TemplatePopupProps {
  template: TemplateInfo | null;
  isOpen: boolean;
  onClose: () => void;
}

export function TemplatePopup({ template, isOpen, onClose }: TemplatePopupProps) {
  if (!template) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full max-w-4xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {template.name}
            <Badge variant="secondary" className="text-xs">
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
            <h3 className="text-lg font-semibold mb-4">Required Fields</h3>
            {template.requiredFields.length > 0 ? (
              <div className="space-y-3">
                {template.requiredFields.map((field, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="font-medium text-sm">{field.name}</div>
                      {field.example && (
                        <div className="text-xs text-muted-foreground mt-1">
                          e.g., {field.example}
                        </div>
                      )}
                    </div>
                    <Badge variant="outline" className="text-xs">
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
            <h3 className="text-lg font-semibold mb-4">Template Example</h3>
            <ScrollArea className="h-96 w-full rounded-lg border">
              <div className="p-4">
                <pre className="text-sm font-mono whitespace-pre-wrap text-foreground">
                  {template.templateExample || "Template example not available"}
                </pre>
              </div>
            </ScrollArea>
            <div className="mt-2 text-xs text-muted-foreground">
              <strong>Note:</strong> Fields shown as [FIELD_NAME] will be replaced with actual values when SOFIA generates the document.
            </div>
          </div>

          {/* Usage Instructions */}
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="font-semibold text-sm mb-2 text-blue-800 dark:text-blue-200">
              How to use this template:
            </h4>
            <ol className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-decimal list-inside">
              <li>Start a new chat with SOFIA</li>
              <li>Provide the required fields listed above</li>
              <li>SOFIA will automatically detect the appropriate template</li>
              <li>The document will be generated instantly with your information</li>
            </ol>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}