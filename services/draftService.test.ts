const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
})();
Object.defineProperty(global, 'localStorage', {
  value: mockLocalStorage,
});

import { describe, it, expect, beforeEach, spyOn, afterEach } from 'bun:test';
import { saveDraft, getDraft, clearDraft } from './draftService';
import { DRAFT_PREFIX } from '../constants/storageKeys';
import { logger } from './logger';

describe('draftService', () => {
    let spy: any;

    beforeEach(() => {
        localStorage.clear();
        spy = spyOn(logger, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        // @ts-ignore
        spy.mockRestore();
    });

    it('saves draft correctly', () => {
        saveDraft('chat-1', 'Hello world');
        expect(localStorage.getItem(`${DRAFT_PREFIX}chat-1`)).toBe('Hello world');
    });

    it('clears draft if text is empty', () => {
        localStorage.setItem(`${DRAFT_PREFIX}chat-2`, 'existing');
        saveDraft('chat-2', '   ');
        expect(localStorage.getItem(`${DRAFT_PREFIX}chat-2`)).toBeNull();
    });

    it('gets draft correctly', () => {
        localStorage.setItem(`${DRAFT_PREFIX}chat-3`, 'Saved text');
        const draft = getDraft('chat-3');
        expect(draft).toBe('Saved text');
    });

    it('returns null if no draft exists', () => {
        const draft = getDraft('chat-4');
        expect(draft).toBeNull();
    });

    it('clears draft correctly', () => {
        localStorage.setItem(`${DRAFT_PREFIX}chat-5`, 'To be cleared');
        clearDraft('chat-5');
        expect(localStorage.getItem(`${DRAFT_PREFIX}chat-5`)).toBeNull();
    });
});
