import { useEffect, useState } from "react";
import type { TemplateCategory, TemplateData, TemplateInfo, TemplateField } from '@/types/template';

/**
 * Load template data from API
 */
export function getTemplateData(): TemplateData {
  throw new Error("getTemplateData should only be called in server components");
}

/**
 * Hook to fetch template data on client side
 */
export function useTemplateData() {
  const [data, setData] = useState<TemplateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const response = await fetch('/api/templates');
        if (!response.ok) {
          throw new Error('Failed to fetch template data');
        }
        const templateData = await response.json();
        setData(templateData);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch template data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  return { data, loading, error };
}

/**
 * Get template by ID (client side)
 */
export function getTemplateById(id: string, templateData: TemplateData): TemplateInfo | null {
  if (!templateData) return null;
  return templateData.allTemplates.find(template => template.id === id) || null;
}

/**
 * Get templates by category (client side)
 */
export function getTemplatesByCategory(category: string, templateData: TemplateData): TemplateInfo[] {
  if (!templateData) return [];
  return templateData.allTemplates.filter(template => template.category === category);
}

