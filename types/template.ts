export interface TemplateField {
  name: string;
  example: string;
  required: boolean;
}

export interface TemplateCategory {
  id: string;
  name: string;
  templates: TemplateInfo[];
}

export interface TemplateInfo {
  id: string;
  name: string;
  category: "registration" | "viewing" | "marketing" | "communication";
  requiredFields: TemplateField[];
  templateExample: string;
  description?: string;
}

export interface TemplateData {
  categories: TemplateCategory[];
  allTemplates: TemplateInfo[];
}
