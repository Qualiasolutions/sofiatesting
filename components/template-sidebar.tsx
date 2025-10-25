"use client";

import { ChevronDown, ChevronRight, FileText } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useTemplateData } from "@/lib/template-data";
import type { TemplateInfo } from "@/types/template";
import { TemplatePopup } from "./template-popup";

export function TemplateSidebar() {
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateInfo | null>(
    null
  );
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(["registration", "viewing", "marketing", "communication"])
  );

  const { data: templateData, loading, error } = useTemplateData();

  const handleTemplateClick = (template: TemplateInfo) => {
    setSelectedTemplate(template);
    setIsPopupOpen(true);
  };

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const handlePopupClose = () => {
    setIsPopupOpen(false);
    // Delay clearing selected template to allow smooth close animation
    setTimeout(() => setSelectedTemplate(null), 300);
  };

  if (loading) {
    return (
      <div className="hidden w-80 border-border border-l bg-background lg:flex">
        <div className="flex flex-1 flex-col items-center justify-center p-8">
          <div className="h-8 w-8 animate-spin rounded-full border-primary border-b-2" />
          <p className="mt-4 text-muted-foreground text-sm">
            Loading templates...
          </p>
        </div>
      </div>
    );
  }

  if (error || !templateData) {
    return (
      <div className="hidden w-80 border-border border-l bg-background lg:flex">
        <div className="flex flex-1 flex-col items-center justify-center p-8">
          <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
          <p className="text-center text-muted-foreground text-sm">
            Failed to load templates
          </p>
          <button
            className="mt-4 rounded-md bg-primary px-4 py-2 text-primary-foreground text-sm hover:bg-primary/90"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="hidden w-80 border-border border-l bg-background lg:flex">
        <div className="flex flex-1 flex-col">
          {/* Header */}
          <div className="border-border border-b p-4">
            <div className="mb-2 flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <h2 className="font-semibold text-lg">SOFIA Templates</h2>
            </div>
            <p className="text-muted-foreground text-sm">
              Click any template to see required fields and examples
            </p>
          </div>

          {/* Template List */}
          <ScrollArea className="flex-1">
            <div className="space-y-4 p-4">
              {templateData.categories.map((category) => (
                <Collapsible
                  key={category.id}
                  onOpenChange={() => toggleCategory(category.id)}
                  open={expandedCategories.has(category.id)}
                >
                  <CollapsibleTrigger asChild>
                    <Button
                      className="h-auto w-full justify-start p-3 hover:bg-muted"
                      variant="ghost"
                    >
                      <div className="flex w-full items-center justify-between">
                        <div className="flex items-center gap-2">
                          {expandedCategories.has(category.id) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                          <span className="font-medium">{category.name}</span>
                        </div>
                        <Badge className="text-xs" variant="secondary">
                          {category.templates.length}
                        </Badge>
                      </div>
                    </Button>
                  </CollapsibleTrigger>

                  <CollapsibleContent className="mt-2 space-y-1">
                    {category.templates.map((template) => (
                      <button
                        className="group w-full rounded-lg p-3 text-left transition-colors hover:bg-muted/80"
                        key={template.id}
                        onClick={() => handleTemplateClick(template)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-sm transition-colors group-hover:text-primary">
                              {template.name}
                            </div>
                            <div className="mt-1 text-muted-foreground text-xs">
                              {template.requiredFields.length} required field
                              {template.requiredFields.length !== 1 ? "s" : ""}
                            </div>
                          </div>
                          <Badge
                            className="text-xs opacity-0 transition-opacity group-hover:opacity-100"
                            variant="outline"
                          >
                            View
                          </Badge>
                        </div>
                      </button>
                    ))}
                  </CollapsibleContent>

                  {category.id !==
                    templateData.categories[templateData.categories.length - 1]
                      .id && <Separator className="mt-4" />}
                </Collapsible>
              ))}
            </div>
          </ScrollArea>

          {/* Footer */}
          <div className="border-border border-t p-4">
            <div className="text-center text-muted-foreground text-xs">
              Total: {templateData.allTemplates.length} templates across 4
              categories
            </div>
          </div>
        </div>
      </div>

      {/* Template Popup */}
      <TemplatePopup
        isOpen={isPopupOpen}
        onClose={handlePopupClose}
        template={selectedTemplate}
      />
    </>
  );
}
