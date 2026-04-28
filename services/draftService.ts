import { DRAFT_PREFIX } from '../constants/storageKeys';
import { logger } from './logger';

export const saveDraft = (chatId: string, text: string): void => {
  try {
    if (!text || text.trim() === '') {
      localStorage.removeItem(`${DRAFT_PREFIX}${chatId}`);
      return;
    }
    localStorage.setItem(`${DRAFT_PREFIX}${chatId}`, text);
  } catch (error) {
    logger.error(`Failed to save draft for chat: ${chatId}`, error);
  }
};

export const getDraft = (chatId: string): string | null => {
  try {
    return localStorage.getItem(`${DRAFT_PREFIX}${chatId}`);
  } catch (error) {
    logger.error(`Failed to get draft for chat: ${chatId}`, error);
    return null;
  }
};

export const clearDraft = (chatId: string): void => {
  try {
    localStorage.removeItem(`${DRAFT_PREFIX}${chatId}`);
  } catch (error) {
    logger.error(`Failed to clear draft for chat: ${chatId}`, error);
  }
};
