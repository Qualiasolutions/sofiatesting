"use client";

import { useState, useMemo } from "react";
import { useTemplateData } from "@/lib/template-data";
import type { TemplateInfo } from "@/types/template";
import { TemplatePopup } from "./template-popup";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export function TemplateSidebar() {
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateInfo | null>(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['registration', 'viewing', 'marketing', 'communication']));

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
      <div className="hidden lg:flex w-80 border-l border-border bg-background">
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground mt-4">Loading templates...</p>
        </div>
      </div>
    );
  }

  if (error || !templateData) {
    return (
      <div className="hidden lg:flex w-80 border-l border-border bg-background">
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground text-center">
            Failed to load templates
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="hidden lg:flex w-80 border-l border-border bg-background">
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <h2 className="font-semibold text-lg">SOFIA Templates</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Click any template to see required fields and examples
            </p>
          </div>

          {/* Template List */}
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
              {templateData.categories.map((category) => (
                <Collapsible
                  key={category.id}
                  open={expandedCategories.has(category.id)}
                  onOpenChange={() => toggleCategory(category.id)}
                >
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-start h-auto p-3 hover:bg-muted"
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          {expandedCategories.has(category.id) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                          <span className="font-medium">{category.name}</span>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {category.templates.length}
                        </Badge>
                      </div>
                    </Button>
                  </CollapsibleTrigger>

                  <CollapsibleContent className="space-y-1 mt-2">
                    {category.templates.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => handleTemplateClick(template)}
                        className="w-full text-left p-3 rounded-lg hover:bg-muted/80 transition-colors group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium group-hover:text-primary transition-colors">
                              {template.name}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {template.requiredFields.length} required field{template.requiredFields.length !== 1 ? 's' : ''}
                            </div>
                          </div>
                          <Badge
                            variant="outline"
                            className="text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            View
                          </Badge>
                        </div>
                      </button>
                    ))}
                  </CollapsibleContent>

                  {category.id !== templateData.categories[templateData.categories.length - 1].id && (
                    <Separator className="mt-4" />
                  )}
                </Collapsible>
              ))}
            </div>
          </ScrollArea>

          {/* Footer */}
          <div className="p-4 border-t border-border">
            <div className="text-xs text-muted-foreground text-center">
              Total: {templateData.allTemplates.length} templates across 4 categories
            </div>
          </div>
        </div>
      </div>

      {/* Template Popup */}
      <TemplatePopup
        template={selectedTemplate}
        isOpen={isPopupOpen}
        onClose={handlePopupClose}
      />
    </>
  );
}