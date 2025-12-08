/**
 * Routing Constants for SOPHIA AI Lead Distribution
 *
 * Based on SOPHIA_AI_SPECIFICATION.md.pdf requirements:
 * - Limassol leads go ONLY to Michelle or Diana
 * - "Zyprus Others" group leads go ONLY to Lauren or Charalambos
 * - Russian-speaking clients prefer Diana
 */

// Limassol region: ONLY these two managers receive leads
// Per spec: "RULE: Never forward to individual agents, FORWARD TO: Michelle OR Diana (only these two)"
export const LIMASSOL_AGENTS = ["Michelle Longridge", "Diana Kultaseva"];

// "Zyprus Others" group (Nicosia, Larnaca, Famagusta): ONLY these two
// Per spec: "RULE: Forward to regional manager of that area, Restricted to Lauren and Haralambos only"
export const OTHERS_GROUP_AGENTS = ["Lauren Ellingham", "Charalambos Pitros"];

// Russian-speaking preference
// Per spec: "CONDITION: If lead appears Russian-speaking → prefer Diana"
export const RUSSIAN_SPEAKER_AGENT = "Diana Kultaseva";

// Regional managers for fallback routing
export const REGIONAL_MANAGERS: Record<string, string> = {
  Paphos: "Marios Azinas",
  Larnaca: "Lysandros Ioanni",
  Famagusta: "Narine Akopyan",
  Nicosia: "Ivan Kazakov",
  Limassol: "Michelle Longridge", // Fallback
};

// Regex pattern for detecting when client requests a specific agent
// Per spec: "Client wants to speak with [Agent Name]" → Forward directly to named agent
export const AGENT_REQUEST_PATTERN =
  /(?:wants?\s+to\s+speak\s+with|asked?\s+for|requesting?|speak(?:ing)?\s+(?:to|with))\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i;

/**
 * Detect if a message contains Russian language indicators
 * Checks for Cyrillic characters and common Russian name patterns
 */
export function detectRussianLanguage(
  text: string,
  senderName: string
): boolean {
  // Check for Cyrillic characters in message or sender name
  const cyrillicPattern = /[\u0400-\u04FF]/;
  if (cyrillicPattern.test(text) || cyrillicPattern.test(senderName)) {
    return true;
  }

  // Check for common Russian/Ukrainian/Slavic name suffixes
  const slavicNamePattern =
    /\b\w*(ov|ova|ev|eva|enko|sky|skaya|ich|ovich|ovna|uk|yuk|ko)\b/i;
  if (slavicNamePattern.test(senderName)) {
    return true;
  }

  return false;
}

/**
 * Check if the group type is "others" (Nicosia, Larnaca, Famagusta)
 * These leads should ONLY go to Lauren or Charalambos per spec
 */
export function isOthersGroup(groupType: string): boolean {
  return groupType === "others";
}

/**
 * Check if region is Limassol - special routing applies
 */
export function isLimassolRegion(region: string | null): boolean {
  return region?.toLowerCase() === "limassol";
}
