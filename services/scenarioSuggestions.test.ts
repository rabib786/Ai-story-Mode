import { describe, it, expect } from 'bun:test';
import { analyzeDescription, analyzeWorldDetails, checkFormattingIssues } from './scenarioSuggestions';
import { ScenarioCharacter } from '../types';

describe('scenarioSuggestions', () => {
    describe('analyzeDescription', () => {
        it('returns warning for short description', () => {
            const result = analyzeDescription('Too short');
            expect(result).not.toBeNull();
            expect(result?.type).toBe('info');
        });

        it('returns null for adequate description', () => {
            const longDesc = 'A'.repeat(60);
            const result = analyzeDescription(longDesc);
            expect(result).toBeNull();
        });
    });

    describe('analyzeWorldDetails', () => {
        const chars: ScenarioCharacter[] = [
            { name: 'Alice', role: '', personality: '', backstory: '' },
            { name: 'Bob', role: '', personality: '', backstory: '' }
        ];

        it('warns about missing characters', () => {
            const text = "A".repeat(150) + " Alice was there.";
            const suggestions = analyzeWorldDetails(text, chars);
            const missingWarning = suggestions.find(s => s.type === 'warning' && s.message.includes('Bob'));
            expect(missingWarning).toBeDefined();
        });

        it('does not warn if all characters are present', () => {
             const text = "A".repeat(150) + " Alice and Bob were there.";
             const suggestions = analyzeWorldDetails(text, chars);
             const missingWarning = suggestions.find(s => s.type === 'warning' && s.message.includes('Bob'));
             expect(missingWarning).toBeUndefined();
        });

        it('warns about action heavy text', () => {
             const text = "A".repeat(150) + " He ran fast, suddenly jumped, and hit with a quick attack.";
             const suggestions = analyzeWorldDetails(text, chars);
             const actionInfo = suggestions.find(s => s.type === 'info' && s.message.includes('action-heavy'));
             expect(actionInfo).toBeDefined();
        });
    });

    describe('checkFormattingIssues', () => {
        it('detects missing double brackets around user', () => {
            const result = checkFormattingIssues('Hello {user}, how are you?');
            expect(result).not.toBeNull();
            expect(result?.type).toBe('warning');
            expect(result?.message).toContain('{{user}}');
        });

        it('does not warn for proper formatting', () => {
            const result = checkFormattingIssues('Hello {{user}}, how are you?');
            expect(result).toBeNull();
        });

        it('does not warn if user tag is not present at all', () => {
             const result = checkFormattingIssues('Hello Bob, how are you?');
             expect(result).toBeNull();
        });
    });
});
