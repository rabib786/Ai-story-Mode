import { logger } from './logger';

/**
 * Asynchronously saves data to localStorage to prevent blocking the main thread
 * during React render cycles or state updates. This is especially useful for large
 * strings like chat histories or scenarios.
 *
 * @param key The localStorage key
 * @param data The data to stringify and save
 */
export const saveToStorageAsync = (key: string, data: any): void => {
    // Defer the expensive JSON.stringify and localStorage setItem operation
    // to the end of the event loop tick using setTimeout.
    setTimeout(() => {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (error) {
            logger.error(`Failed to save to localStorage for key: ${key}`, error);
        }
    }, 0);
};
