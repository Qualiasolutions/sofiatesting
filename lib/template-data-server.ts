import { readFileSync } from 'fs';
import { join } from 'path';
import { getTemplateRegistry } from './ai/instructions/template-loader';
import type { TemplateCategory, TemplateData, TemplateInfo, TemplateField } from '@/types/template';

// Ensure this only runs on server side
if (typeof window !== 'undefined') {
  throw new Error('template-data-server can only be used on the server side');
}

const TEMPLATES_DIR = join(process.cwd(), 'lib/ai/instructions/templates');

/**
 * Extract required fields from template content
 */
function extractRequiredFields(templateContent: string): TemplateField[] {
  const fields: TemplateField[] = [];

  // Look for "Required Fields:" section
  const requiredFieldsMatch = templateContent.match(/Required Fields:\s*\n([\s\S]*?)(?=\n\n|\nSubject:|$)/i);
  if (!requiredFieldsMatch) return fields;

  const fieldsSection = requiredFieldsMatch[1];

  // Extract field names and examples
  const fieldMatches = fieldsSection.matchAll(/([^\n]+?)\s*\([^)]*e\.g\.\s*([^)]+)\)/gi);

  for (const match of fieldMatches) {
    const fieldName = match[1].trim();
    const example = match[2].trim();

    // Skip if it's not actually a field (like "Subject:" line)
    if (fieldName.toLowerCase().includes('subject:')) continue;

    fields.push({
      name: fieldName,
      example: example,
      required: true
    });
  }

  // Also look for field placeholders in the template itself
  const placeholderMatches = templateContent.matchAll(/\[([^\]]+)\]/g);
  const placeholderNames = new Set<string>();

  for (const match of placeholderMatches) {
    placeholderNames.add(match[1]);
  }

  // Add any placeholders that weren't found in the Required Fields section
  for (const placeholder of placeholderNames) {
    const exists = fields.some(field =>
      field.name.toLowerCase().includes(placeholder.toLowerCase()) ||
      placeholder.toLowerCase().includes(field.name.toLowerCase())
    );

    if (!exists && !placeholder.toLowerCase().includes('example')) {
      fields.push({
        name: placeholder,
        example: '',
        required: true
      });
    }
  }

  return fields;
}

/**
 * Get template example with placeholders
 */
function getTemplateExample(templateContent: string): string {
  // Find the actual template content (after metadata)
  const lines = templateContent.split('\n');
  let templateStart = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line && !line.toLowerCase().includes('required fields') &&
        !line.toLowerCase().includes('template') &&
        !line.toLowerCase().includes('subject:') &&
        !line.match(/^[a-zA-Z\s]*$/)) { // Skip category headers
      templateStart = i;
      break;
    }
  }

  if (templateStart === -1) return '';

  const exampleLines = lines.slice(templateStart);

  // Clean up the example
  return exampleLines
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n');
}

/**
 * Load and parse all template data
 */
export function getTemplateData(): TemplateData {
  const registry = getTemplateRegistry();
  const templates: TemplateInfo[] = [];

  // Group templates by category
  const categoriesMap = new Map<string, TemplateInfo[]>();

  for (const templateMeta of registry) {
    try {
      const templatePath = join(TEMPLATES_DIR, templateMeta.file);
      const templateContent = readFileSync(templatePath, 'utf8');

      const requiredFields = extractRequiredFields(templateContent);
      const templateExample = getTemplateExample(templateContent);

      const templateInfo: TemplateInfo = {
        id: templateMeta.id,
        name: templateMeta.name,
        category: templateMeta.category,
        requiredFields,
        templateExample
      };

      templates.push(templateInfo);

      if (!categoriesMap.has(templateMeta.category)) {
        categoriesMap.set(templateMeta.category, []);
      }
      categoriesMap.get(templateMeta.category)!.push(templateInfo);

    } catch (error) {
      console.warn(`Failed to load template ${templateMeta.id}:`, error);
    }
  }

  // Create categories with proper names
  const categories: TemplateCategory[] = [
    {
      id: 'registration',
      name: 'Registrations',
      templates: categoriesMap.get('registration') || []
    },
    {
      id: 'viewing',
      name: 'Viewing Forms & Reservations',
      templates: categoriesMap.get('viewing') || []
    },
    {
      id: 'marketing',
      name: 'Marketing Agreements',
      templates: categoriesMap.get('marketing') || []
    },
    {
      id: 'communication',
      name: 'Client Communications',
      templates: categoriesMap.get('communication') || []
    }
  ];

  return {
    categories,
    allTemplates: templates
  };
}