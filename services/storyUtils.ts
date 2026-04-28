import { type GenerateContentResponse } from '@google/genai';
import { ModelResponsePart } from '../types';

/**
 * Safely parse the narrative to separate plain text from dialogue content.
 * This prevents HTML injection from dialogue content.
 */
export const parseNarrative = (narrative: string): Array<{type: 'text' | 'dialogue', content: string}> => {
  if (!narrative) return [];
  const parts: Array<{type: 'text' | 'dialogue', content: string}> = [];
  let lastIndex = 0;
  const regex = /<dialogue>(.*?)<\/dialogue>/gis; // s flag for multiline, i for case-insensitive tags
  let match;

  while ((match = regex.exec(narrative)) !== null) {
    // Text before the dialogue
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: narrative.substring(lastIndex, match.index) });
    }
    // The dialogue content itself
    parts.push({ type: 'dialogue', content: match[1] });
    lastIndex = regex.lastIndex;
  }

  // Any remaining text after the last dialogue
  if (lastIndex < narrative.length) {
    parts.push({ type: 'text', content: narrative.substring(lastIndex) });
  }

  // If no matches were found, the whole thing is text
  if (parts.length === 0 && narrative.length > 0) {
      parts.push({ type: 'text', content: narrative });
  }

  return parts;
};

/**
 * Parses the AI response from Gemini/OpenAI-compatible APIs.
 */
export const parseApiResponse = (response: GenerateContentResponse): ModelResponsePart | null => {
  try {
    // The .text accessor is a convenience property. If it's undefined, the response was likely empty or blocked by safety filters.
    const jsonText = response.text;

    if (!jsonText) {
        // Log the entire response object to help debug why the text is missing (e.g., safety ratings).
        console.error("AI response text is empty or undefined. Full response:", JSON.stringify(response, null, 2));
        throw new Error("Empty or invalid response from AI. The request may have been blocked by safety filters.");
    }

    // Sanitize jsonText to remove markdown code block formatting if present
    let cleanedText = jsonText.trim();
    if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.substring(7);
    } else if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.substring(3);
    }
    if (cleanedText.endsWith('```')) {
        cleanedText = cleanedText.substring(0, cleanedText.length - 3);
    }
    cleanedText = cleanedText.trim();

    const data = JSON.parse(extractJsonPayload(cleanedText));

    const newPart: ModelResponsePart = {
      narrative: typeof data.narrative === 'string' ? data.narrative : '',
      suggestedActions: normalizeStringArray(data.suggested_actions),
      memoryAdditions: normalizeStringArray(data.memory_additions),
      dominantEmotion: typeof data.dominant_emotion === 'string' && data.dominant_emotion.trim() ? data.dominant_emotion : 'neutral',
    };

    return newPart;
  } catch (e) {
    console.error("Failed to parse model JSON response. Full response object:", response, "Error:", e);
    return null;
  }
};

function extractJsonPayload(rawText: string): string {
  const trimmed = rawText.trim();
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    return trimmed;
  }

  let depth = 0;
  let start = -1;
  let inString = false;
  let escapeNext = false;

  for (let i = 0; i < trimmed.length; i++) {
    const char = trimmed[i];

    if (escapeNext) {
      escapeNext = false;
      continue;
    }
    if (char === '\\') {
      escapeNext = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (inString) {
      continue;
    }

    if (char === '{') {
      if (depth === 0) {
        start = i;
      }
      depth++;
    } else if (char === '}') {
      depth--;
      if (depth === 0 && start !== -1) {
        return trimmed.slice(start, i + 1);
      }
    }
  }

  return trimmed;
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}
