import { ScenarioCharacter } from '../types';

export interface Suggestion {
  type: 'warning' | 'info';
  message: string;
}

export const analyzeDescription = (text: string): Suggestion | null => {
  if (!text) return null;
  if (text.length < 50) {
    return { type: 'info', message: 'Your description is quite short. Consider adding more details to set the scene.' };
  }
  return null;
};

export const analyzeWorldDetails = (text: string, characters: ScenarioCharacter[]): Suggestion[] => {
  if (!text) return [];
  const suggestions: Suggestion[] = [];

  if (text.length < 100) {
    suggestions.push({ type: 'info', message: 'The backstory is very short. Expanding it will help the AI understand the world better.' });
  }

  // Check for missing character mentions
  const missingCharacters = characters.filter(c => !text.toLowerCase().includes(c.name.toLowerCase()));
  if (missingCharacters.length > 0 && missingCharacters.length <= 3) {
    suggestions.push({
      type: 'warning',
      message: `Consider mentioning ${missingCharacters.map(c => c.name).join(', ')} in the backstory to establish their role.`
    });
  }

  // Basic Tone/Pacing heuristic
  const actionWords = ['suddenly', 'ran', 'hit', 'attack', 'jump', 'fast', 'quick'];
  let actionCount = 0;
  actionWords.forEach(word => {
      if (text.toLowerCase().includes(word)) actionCount++;
  });
  if (actionCount > 3) {
      suggestions.push({ type: 'info', message: 'This scene seems very action-heavy. Consider adding a calm moment for pacing.' });
  }

  return suggestions;
};

export const checkFormattingIssues = (text: string): Suggestion | null => {
  if (!text) return null;
  // Look for single {user} instead of {{user}}
  if (text.match(/(?<!\{)\{user\}(?!\})/i)) {
    return { type: 'warning', message: 'Detected "{user}". You probably want to use "{{user}}" to properly substitute the player character.' };
  }
  return null;
};
