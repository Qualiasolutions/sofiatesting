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
    // UPDATED: Read from root directory "GENERAL KNOWLEDGE.html"
    const filePath = path.join(process.cwd(), 'GENERAL KNOWLEDGE.html');
    const htmlContent = fs.readFileSync(filePath, 'utf-8');

    // Extract slide content using regex patterns
    // Matches the structure of the provided HTML file
    // Updated regex to be more robust for comment matching
    const slideRegex = /<!-- Slide (\d+):.*?-->[\s\S]*?<div class="slide(?: active)?">[\s\S]*?<div class="slide-counter">(\d+) \/ 36<\/div>[\s\S]*?<div class="slide-header">[\s\S]*?<div class="slide-title">(.*?)<\/div>([\s\S]*?<div class="slide-subtitle">(.*?)<\/div>)?[\s\S]*?<div class="slide-content">([\s\S]*?)<\/div>[\s\S]*?<\/div>/g;

    const slides: SlideContent[] = [];
    let match;

    while ((match = slideRegex.exec(htmlContent)) !== null) {
      const slideNumber = parseInt(match[1]);
      const title = match[3].trim();
      const subtitle = match[5] ? match[5].trim() : undefined;
      let content = match[6].trim();

      // Clean up HTML content and convert to plain text
      // We want to preserve the text structure but remove HTML tags
      content = content
        .replace(/<h2[^>]*>/g, '\n**')
        .replace(/<\/h2>/g, '**\n')
        .replace(/<h3[^>]*>/g, '\n*')
        .replace(/<\/h3>/g, '*\n')
        .replace(/<strong[^>]*>/g, '**')
        .replace(/<\/strong>/g, '**')
        .replace(/<li[^>]*>/g, '\n- ')
        .replace(/<\/li>/g, '')
        .replace(/<br\s*\/?>/g, '\n')
        .replace(/<p[^>]*>/g, '\n')
        .replace(/<\/p>/g, '\n')
        .replace(/<div class="highlight"[^>]*>/g, '\n> ') // Handle highlight blocks as quotes
        .replace(/<\/div>/g, '\n')
        .replace(/<table[^>]*>[\s\S]*?<\/table>/g, (match) => {
             // Basic table to text conversion could be improved, but for now just strip tags
             // or maybe try to preserve rows?
             // Let's just strip tags for now, tables are hard with regex
             return match.replace(/<tr[^>]*>/g, '\n').replace(/<td[^>]*>/g, ' | ').replace(/<th[^>]*>/g, ' | ');
        })
        .replace(/<[^>]*>/g, '') // Remove remaining tags
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/\n{3,}/g, '\n\n') // Normalize multiple newlines
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

  // Simple keyword matching
  return slides.filter(slide =>
    slide.title.toLowerCase().includes(queryLower) ||
    (slide.subtitle && slide.subtitle.toLowerCase().includes(queryLower)) ||
    slide.content.toLowerCase().includes(queryLower)
  );
}

export const getGeneralKnowledge = tool({
  description: "Get STRICT general knowledge from the official slides. You MUST use this tool for ANY general knowledge question (VAT, taxes, PR, investment, etc.). You MUST output the content EXACTLY as returned by this tool. Do NOT summarize or rephrase.",
  inputSchema: z.object({
    query: z.string().describe("The search query or topic to find information about"),
    slideNumber: z.number().optional().describe("Optional specific slide number to retrieve (1-36)")
  }),
  execute: async ({ query, slideNumber }) => {
    const slides = parseSlidesContent();

    if (slideNumber) {
      // Return specific slide
      const slide = slides.find(s => s.slideNumber === slideNumber);
      if (slide) {
        // STRICT OUTPUT FORMAT: Just the content
        return `**${slide.title}**\n${slide.subtitle ? slide.subtitle + '\n' : ''}\n${slide.content}`;
      } else {
        return "Slide not found.";
      }
    }

    if (query) {
      // Search for relevant slides
      const relevantSlides = searchSlidesContent(query);

      if (relevantSlides.length === 0) {
        return "I do not have information on that topic in my official knowledge base.";
      }

      // Return the content of the most relevant slide(s)
      // If multiple matches, return top 1 to be very specific as requested
      const slidesToReturn = relevantSlides.slice(0, 1); 
      
      const formattedContent = slidesToReturn.map(slide => {
        let content = `**${slide.title}**`;
        if (slide.subtitle) {
          content += `\n${slide.subtitle}`;
        }
        content += `\n\n${slide.content}`;
        return content;
      }).join('\n\n---\n\n');

      return formattedContent;
    }

    return "Please specify a topic.";
  },
});