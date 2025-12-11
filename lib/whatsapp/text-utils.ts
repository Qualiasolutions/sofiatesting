/**
 * WhatsApp Text Utilities
 * Pure functions for text processing that can be tested independently
 */

/**
 * Split subject line from email body for separate WhatsApp messages
 * Subject line can appear as "Subject: X" or just at the start of the response
 */
export function splitSubjectFromBody(text: string): {
  subject: string | null;
  body: string;
} {
  // Match "Subject:" at the start of a line (case-insensitive)
  // Using [^\n]+ instead of .+? to prevent ReDoS (catastrophic backtracking)
  const subjectMatch = text.match(/^(Subject:\s*[^\n]+)(?:\n\n|\n(?=Dear|Email Body))/im);

  if (subjectMatch) {
    const subject = subjectMatch[1].trim();
    // Remove the subject line and any "Email Body:" marker from the body
    const body = text
      .replace(subjectMatch[0], "")
      .replace(/^Email Body:\s*/im, "")
      .trim();

    return { subject, body };
  }

  return { subject: null, body: text };
}

/**
 * Format text for WhatsApp (plain text mode)
 */
export function formatForWhatsApp(text: string): string {
  let formatted = text;

  // WhatsApp supports basic markdown: *bold*, _italic_, ~strikethrough~, ```code```
  // Convert our markdown to WhatsApp format

  // Bold: **text** -> *text* (WhatsApp format)
  formatted = formatted.replace(/\*\*(.+?)\*\*/g, "*$1*");

  // Clean up multiple newlines
  formatted = formatted.replace(/\n{3,}/g, "\n\n");

  return formatted.trim();
}
