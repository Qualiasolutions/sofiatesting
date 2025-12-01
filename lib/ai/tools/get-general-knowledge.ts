import fs from "node:fs";
import path from "node:path";
import { tool } from "ai";
import { z } from "zod";

type SlideContent = {
  slideNumber: number;
  title: string;
  subtitle?: string;
  content: string;
};

interface ScoredSlide extends SlideContent {
  score: number;
}

// Cache the parsed slides content to avoid reading file multiple times
let cachedSlides: SlideContent[] | null = null;

// Cyprus real estate domain-specific synonyms for better search recall
const SYNONYMS: Record<string, string[]> = {
  vat: ["tax", "value added", "5%", "19%", "reduced rate"],
  transfer: ["fees", "buyer tax", "purchase cost", "land registry"],
  "capital gains": ["cgt", "seller tax", "profit tax", "selling tax"],
  pr: ["permanent residence", "residency", "visa", "immigration"],
  "permanent residence": ["pr", "residency", "visa", "immigration"],
  aml: ["kyc", "compliance", "due diligence", "anti-money laundering"],
  kyc: ["aml", "know your customer", "compliance"],
  "title deed": ["ownership", "certificate", "land registry"],
  "contract of sale": ["purchase agreement", "sales contract"],
  investment: ["invest", "investment property", "buy to let"],
  "non-dom": ["non-domicile", "tax status", "domicile"],
  "tax residency": ["183 days", "60 days", "resident", "non-resident"],
  "property tax": ["immovable property", "land tax"],
  "stamp duty": ["stamp", "duties"],
  mortgage: ["loan", "bank financing", "housing loan"],
  minimum: ["min", "minimum size", "minimum sqm", "minimum square"],
  "square meters": ["sqm", "m2", "m²", "square", "size", "area"],
  development: ["building", "construction", "permit", "standards"],
  bedroom: ["1 bed", "2 bed", "3 bed", "studio", "apartment size"],
};

function parseSlidesContent(): SlideContent[] {
  if (cachedSlides) {
    return cachedSlides;
  }

  try {
    // UPDATED: Read from root directory "GENERAL KNOWLEDGE.html"
    const filePath = path.join(process.cwd(), "GENERAL KNOWLEDGE.html");
    const htmlContent = fs.readFileSync(filePath, "utf-8");

    // Extract slide content using regex patterns
    // Matches the structure of the provided HTML file
    // Updated regex to be more robust for comment matching
    const slideRegex =
      /<!-- Slide (\d+):.*?-->[\s\S]*?<div class="slide(?: active)?">[\s\S]*?<div class="slide-counter">(\d+) \/ 36<\/div>[\s\S]*?<div class="slide-header">[\s\S]*?<div class="slide-title">(.*?)<\/div>([\s\S]*?<div class="slide-subtitle">(.*?)<\/div>)?[\s\S]*?<div class="slide-content">([\s\S]*?)<\/div>[\s\S]*?<\/div>/g;

    const slides: SlideContent[] = [];
    let match;

    while ((match = slideRegex.exec(htmlContent)) !== null) {
      const slideNumber = Number.parseInt(match[1], 10);
      const title = match[3].trim();
      const subtitle = match[5] ? match[5].trim() : undefined;
      let content = match[6].trim();

      // Clean up HTML content and convert to plain text
      // We want to preserve the text structure but remove HTML tags
      content = content
        .replace(/<h2[^>]*>/g, "\n**")
        .replace(/<\/h2>/g, "**\n")
        .replace(/<h3[^>]*>/g, "\n*")
        .replace(/<\/h3>/g, "*\n")
        .replace(/<strong[^>]*>/g, "**")
        .replace(/<\/strong>/g, "**")
        .replace(/<li[^>]*>/g, "\n- ")
        .replace(/<\/li>/g, "")
        .replace(/<br\s*\/?>/g, "\n")
        .replace(/<p[^>]*>/g, "\n")
        .replace(/<\/p>/g, "\n")
        .replace(/<div class="highlight"[^>]*>/g, "\n> ") // Handle highlight blocks as quotes
        .replace(/<\/div>/g, "\n")
        .replace(/<table[^>]*>([\s\S]*?)<\/table>/g, (tableMatch) => {
          // Convert HTML table to proper markdown table
          const rows: string[][] = [];
          const rowMatches = tableMatch.match(/<tr[^>]*>[\s\S]*?<\/tr>/g) || [];

          for (const rowMatch of rowMatches) {
            const cells: string[] = [];
            const cellMatches =
              rowMatch.match(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/g) || [];
            for (const cellMatch of cellMatches) {
              const cellContent = cellMatch
                .replace(/<t[hd][^>]*>/g, "")
                .replace(/<\/t[hd]>/g, "")
                .trim();
              cells.push(cellContent);
            }
            if (cells.length > 0) {
              rows.push(cells);
            }
          }

          if (rows.length === 0) {
            return "";
          }

          // Build markdown table
          let mdTable = "\n\n";
          // Header row
          mdTable += `| ${rows[0].join(" | ")} |\n`;
          // Separator row
          mdTable += `|${rows[0].map(() => "---").join("|")}|\n`;
          // Data rows
          for (let i = 1; i < rows.length; i++) {
            mdTable += `| ${rows[i].join(" | ")} |\n`;
          }
          return `${mdTable}\n`;
        })
        .replace(/<[^>]*>/g, "") // Remove remaining tags
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/\n{3,}/g, "\n\n") // Normalize multiple newlines
        .trim();

      slides.push({
        slideNumber,
        title,
        subtitle,
        content,
      });
    }

    cachedSlides = slides;
    return slides;
  } catch (error) {
    console.error("Error reading general knowledge slides:", error);
    return [];
  }
}

/**
 * Expand query with domain-specific synonyms
 */
function expandQueryWithSynonyms(query: string): string[] {
  const queryLower = query.toLowerCase();
  const expandedTerms = new Set<string>([queryLower]);

  // Add synonyms for each word in the query
  const words = queryLower.split(/\s+/);
  for (const word of words) {
    expandedTerms.add(word);
    if (SYNONYMS[word]) {
      for (const synonym of SYNONYMS[word]) {
        expandedTerms.add(synonym);
      }
    }
  }

  // Also check for multi-word phrase matches
  for (const [term, synonymList] of Object.entries(SYNONYMS)) {
    if (queryLower.includes(term)) {
      for (const synonym of synonymList) {
        expandedTerms.add(synonym);
      }
    }
  }

  return Array.from(expandedTerms);
}

/**
 * Score-based search with weighted matching
 * Title matches: 3 points
 * Subtitle matches: 2 points
 * Content matches: 1 point
 * Exact phrase bonus: +5 points
 */
function searchSlidesContent(query: string): ScoredSlide[] {
  const slides = parseSlidesContent();
  const queryLower = query.toLowerCase();
  const expandedTerms = expandQueryWithSynonyms(query);

  const scoredSlides: ScoredSlide[] = [];

  for (const slide of slides) {
    let score = 0;
    const titleLower = slide.title.toLowerCase();
    const subtitleLower = slide.subtitle?.toLowerCase() || "";
    const contentLower = slide.content.toLowerCase();

    // Check exact phrase match first (highest priority)
    if (titleLower.includes(queryLower)) {
      score += 8;
    }
    if (subtitleLower.includes(queryLower)) {
      score += 6;
    }
    if (contentLower.includes(queryLower)) {
      score += 4;
    }

    // Check individual terms and synonyms
    for (const term of expandedTerms) {
      if (titleLower.includes(term)) {
        score += 3;
      }
      if (subtitleLower.includes(term)) {
        score += 2;
      }
      if (contentLower.includes(term)) {
        score += 1;
      }
    }

    if (score > 0) {
      scoredSlides.push({ ...slide, score });
    }
  }

  // Sort by score descending
  return scoredSlides.sort((a, b) => b.score - a.score);
}

export const getGeneralKnowledge = tool({
  description:
    "Get STRICT general knowledge from the official slides. You MUST use this tool for ANY general knowledge question (VAT, taxes, PR, investment, etc.). You MUST output the content EXACTLY as returned by this tool. Do NOT summarize or rephrase.",
  inputSchema: z.object({
    query: z
      .string()
      .describe("The search query or topic to find information about"),
    slideNumber: z
      .number()
      .optional()
      .describe("Optional specific slide number to retrieve (1-36)"),
  }),
  execute: async ({ query, slideNumber }) => {
    try {
      const slides = parseSlidesContent();

      // Graceful degradation if knowledge base is unavailable
      if (slides.length === 0) {
        return "I'm having trouble accessing my knowledge base. Please try again or refer to: https://www.zyprus.com/help";
      }

      if (slideNumber) {
        // Return specific slide
        const slide = slides.find((s) => s.slideNumber === slideNumber);
        if (slide) {
          // STRICT OUTPUT FORMAT: Just the content with source citation
          return `**${slide.title}**\n${slide.subtitle ? `${slide.subtitle}\n` : ""}\n${slide.content}\n\n[Source: SOFIA Knowledge Base - Slide ${slide.slideNumber}/36]`;
        }
        return "Slide not found. Please use slide numbers 1-36.";
      }

      if (query) {
        // Search for relevant slides using enhanced scoring
        const relevantSlides = searchSlidesContent(query);

        if (relevantSlides.length === 0) {
          return "I do not have information on that topic in my official knowledge base.";
        }

        // Return top 2 most relevant slides for comprehensive answers
        // Only return 2nd slide if its score is at least 50% of the top slide's score
        let slidesToReturn = relevantSlides.slice(0, 1);
        if (
          relevantSlides.length > 1 &&
          relevantSlides[1].score >= relevantSlides[0].score * 0.5
        ) {
          slidesToReturn = relevantSlides.slice(0, 2);
        }

        const formattedContent = slidesToReturn
          .map((slide) => {
            let content = `**${slide.title}**`;
            if (slide.subtitle) {
              content += `\n${slide.subtitle}`;
            }
            content += `\n\n${slide.content}`;
            content += `\n\n[Source: SOFIA Knowledge Base - Slide ${slide.slideNumber}/36]`;
            return content;
          })
          .join("\n\n---\n\n");

        return formattedContent;
      }

      return "Please specify a topic.";
    } catch (error) {
      console.error("Knowledge base error:", error);
      return "I'm having trouble accessing my knowledge base. Please try again or refer to: https://www.zyprus.com/help";
    }
  },
});
