import { ApiProvider, ApiSettings } from '../types';
import { LLM_PROVIDER_CONFIG } from '../constants/llmProviders';

export class ApiError extends Error {
  constructor(public message: string, public code: string, public provider: string, public statusCode?: number) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function validateProvider(settings: ApiSettings): Promise<{ isValid: boolean; error?: string }> {
  const config = LLM_PROVIDER_CONFIG[settings.provider];

  if (settings.provider === 'gemini') {
    if (config.requiresApiKey && !settings.geminiApiKey.trim()) {
      return { isValid: false, error: 'API Key is required for Gemini.' };
    }
    if (settings.geminiApiKey && settings.geminiApiKey.length < 10) {
        return { isValid: false, error: 'API Key appears to be invalid.' };
    }
    return { isValid: true };
  } else {
    if (config.requiresApiKey && !settings.openAiCompatibleApiKey.trim()) {
      return { isValid: false, error: `API Key is required for ${config.label}.` };
    }
    if (!settings.openAiCompatibleBaseUrl.trim()) {
      return { isValid: false, error: 'Base URL is required.' };
    }

    if (!config.requiresApiKey) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        const baseUrl = settings.openAiCompatibleBaseUrl.trim().replace(/\/+$/, '');
        const res = await fetch(`${baseUrl}/models`, {
            method: 'GET',
            signal: controller.signal
        }).catch(e => null);

        clearTimeout(timeoutId);

        if (!res) {
             if (baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1')) {
                 return { isValid: false, error: 'Could not connect to local server. Please ensure it is running and CORS is enabled.' };
             }
        }
      } catch (e: any) {
         return { isValid: false, error: `Connection failed: ${e.message}` };
      }
    }

    return { isValid: true };
  }
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  providerName: string,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let retries = 0;
  while (true) {
    try {
      return await operation();
    } catch (error: any) {
      const isNetworkError = error.name === 'TypeError' && error.message === 'Failed to fetch';
      const statusCode = error.status || error.response?.status || error.statusCode;

      const isRetryable = isNetworkError || [408, 429, 500, 502, 503, 504].includes(statusCode);

      if (!isRetryable || retries >= maxRetries) {
        let errorCode = 'UNKNOWN_ERROR';
        if (statusCode === 401 || statusCode === 403) errorCode = 'AUTH_ERROR';
        else if (statusCode === 429) errorCode = 'QUOTA_ERROR';
        else if (statusCode === 404) errorCode = 'MODEL_ERROR';
        else if (statusCode === 408 || isNetworkError) errorCode = 'TIMEOUT_ERROR';

        throw new ApiError(error.message || 'API request failed', errorCode, providerName, statusCode);
      }

      const delay = baseDelay * Math.pow(2, retries);
      await new Promise(resolve => setTimeout(resolve, delay));
      retries++;
    }
  }
}
