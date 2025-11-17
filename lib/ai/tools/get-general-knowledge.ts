import { tool } from "ai";
import { z } from "zod";
import fs from 'fs';
import path from 'path';

interface SlideContent {
  slideNumber: number;
  title: string;
  subtitle?: string;
  content: string;
}

// Cache the parsed slides content to avoid reading file multiple times
let cachedSlides: SlideContent[] | null = null;

function parseSlidesContent(): SlideContent[] {
  if (cachedSlides) {
    return cachedSlides;
  }

  try {
    const filePath = path.join(process.cwd(), 'data', 'general-knowledge.html');
    const htmlContent = fs.readFileSync(filePath, 'utf-8');

    // Extract slide content using regex patterns
    const slideRegex = /<!-- Slide (\d+): [^-]*? -->[\s\S]*?<div class="slide(?: active)?">[\s\S]*?<div class="slide-counter">(\d+) \/ 36<\/div>[\s\S]*?<div class="slide-header">[\s\S]*?<div class="slide-title">(.*?)<\/div>([\s\S]*?<div class="slide-subtitle">(.*?)<\/div>)?[\s\S]*?<div class="slide-content">([\s\S]*?)<\/div>[\s\S]*?<\/div>/g;

    const slides: SlideContent[] = [];
    let match;

    while ((match = slideRegex.exec(htmlContent)) !== null) {
      const slideNumber = parseInt(match[1]);
      const title = match[3].trim();
      const subtitle = match[5] ? match[5].trim() : undefined;
      let content = match[6].trim();

      // Clean up HTML content and convert to plain text
      content = content
        .replace(/<h2[^>]*>/g, '\n**')
        .replace(/<\/h2>/g, '**\n')
        .replace(/<h3[^>]*>/g, '\n*')
        .replace(/<\/h3>/g, '*\n')
        .replace(/<strong[^>]*>/g, '**')
        .replace(/<\/strong>/g, '**')
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/\n+/g, '\n')
        .trim();

      slides.push({
        slideNumber,
        title,
        subtitle,
        content
      });
    }

    cachedSlides = slides;
    return slides;
  } catch (error) {
    console.error('Error reading general knowledge slides:', error);
    return [];
  }
}

function searchSlidesContent(query: string): SlideContent[] {
  const slides = parseSlidesContent();
  const queryLower = query.toLowerCase();

  return slides.filter(slide =>
    slide.title.toLowerCase().includes(queryLower) ||
    slide.subtitle?.toLowerCase().includes(queryLower) ||
    slide.content.toLowerCase().includes(queryLower)
  );
}

export const getGeneralKnowledge = tool({
  description: "Get information from Cyprus real estate general knowledge slides. Use this when asked about ANY general knowledge topics like investment categories for PR, tax residency, VAT policies, property taxes, AML/KYC requirements, land division, minimum square meters, etc.",
  inputSchema: z.object({
    query: z.string().describe("The search query or topic to find information about (e.g., 'investment categories for PR', 'VAT policy', 'tax residency', 'property taxes')"),
    slideNumber: z.number().optional().describe("Optional specific slide number to retrieve (1-36)")
  }),
  execute: async ({ query, slideNumber }) => {
    const slides = parseSlidesContent();

    if (slideNumber) {
      // Return specific slide
      const slide = slides.find(s => s.slideNumber === slideNumber);
      if (slide) {
        return {
          type: "specific_slide",
          slideNumber: slide.slideNumber,
          title: slide.title,
          subtitle: slide.subtitle,
          content: slide.content,
          message: `Slide ${slide.slideNumber}: ${slide.title}`
        };
      } else {
        return {
          error: `Slide ${slideNumber} not found. Available slides: 1-36`,
          availableSlides: slides.map(s => s.slideNumber)
        };
      }
    }

    if (query) {
      // Search for relevant slides
      const relevantSlides = searchSlidesContent(query);

      if (relevantSlides.length === 0) {
        return {
          error: `No information found for query: "${query}"`,
          suggestion: "Try searching for topics like: investment categories, VAT, tax residency, property taxes, AML KYC, land division, minimum square meters",
          availableTopics: [
            "Investment Categories for PR",
            "VAT Policy for Housing",
            "Tax Residency (183 day rule, 60 day rule)",
            "Property Taxes (Buyer taxes, Seller taxes, Capital Gains)",
            "AML/KYC Requirements",
            "Land Division and Green Areas",
            "Minimum Square Meters for Development",
            "Permanent Residence Permit Options",
            "Non-Domicile Status",
            "Cyprus Advantages"
          ]
        };
      }

      // Format the response as copy-paste content as requested
      const formattedContent = relevantSlides.map(slide => {
        let content = `**${slide.title}**`;
        if (slide.subtitle) {
          content += `\n${slide.subtitle}`;
        }
        content += `\n\n${slide.content}`;
        return content;
      }).join('\n\n---\n\n');

      return {
        type: "search_results",
        query,
        slidesFound: relevantSlides.length,
        content: formattedContent,
        slideNumbers: relevantSlides.map(s => s.slideNumber),
        message: `Found ${relevantSlides.length} slide(s) matching "${query}"`
      };
    }

    // If no specific query, return overview
    return {
      type: "overview",
      totalSlides: slides.length,
      availableTopics: [
        "Compliance Requirement (AML/KYC)",
        "Division of Land Plot From Field",
        "Minimum Square Meters For Development",
        "PR and Tax Residency",
        "Property Transaction Taxes",
        "VAT in Real Estate"
      ],
      message: "General knowledge slides loaded. Please specify a topic or slide number.",
      slides: slides.map(s => ({
        number: s.slideNumber,
        title: s.title,
        subtitle: s.subtitle
      }))
    };
  },
});