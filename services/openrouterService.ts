import { logger } from './logger';

export interface OpenRouterModel {
  id: string;
  name?: string;
  pricing?: {
    prompt?: string;
    completion?: string;
    request?: string;
    image?: string;
    web_search?: string;
    internal_reasoning?: string;
    input_cache_read?: string;
    input_cache_write?: string;
  };
  architecture?: {
    output_modalities?: string[];
  };
  supported_parameters?: string[];
}

const OPENROUTER_MODELS_CACHE_KEY = 'openrouter_free_models_cache_v1';
const OPENROUTER_CACHE_TTL_MS = 1000 * 60 * 30;

function isZeroPrice(value?: string): boolean {
  return (value || '0') === '0';
}

function supportsTextOutput(model: OpenRouterModel): boolean {
  const modalities = model.architecture?.output_modalities;
  if (!modalities || modalities.length === 0) return true;
  return modalities.includes('text');
}

function isFreeModel(model: OpenRouterModel): boolean {
  if (model.id.endsWith(':free')) return true;

  const pricing = model.pricing || {};
  return (
    isZeroPrice(pricing.prompt) &&
    isZeroPrice(pricing.completion) &&
    isZeroPrice(pricing.request) &&
    isZeroPrice(pricing.internal_reasoning) &&
    isZeroPrice(pricing.web_search)
  );
}

export function getOpenRouterHeaders(apiKey: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
    'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'http://localhost',
    'X-Title': 'Story Mode AI',
  };

  return headers;
}

function readCachedModelIds(): string[] | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(OPENROUTER_MODELS_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { ts: number; ids: string[] };
    if (!Array.isArray(parsed.ids) || typeof parsed.ts !== 'number') return null;
    if (Date.now() - parsed.ts > OPENROUTER_CACHE_TTL_MS) return null;
    return parsed.ids;
  } catch {
    return null;
  }
}

function writeCachedModelIds(ids: string[]) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(OPENROUTER_MODELS_CACHE_KEY, JSON.stringify({ ts: Date.now(), ids }));
  } catch {
    // ignore cache write failures
  }
}

export async function listOpenRouterFreeModelIds(apiKey: string, forceRefresh = false): Promise<string[]> {
  if (!forceRefresh) {
    const cached = readCachedModelIds();
    if (cached && cached.length > 0) return cached;
  }

  const response = await fetch('https://openrouter.ai/api/v1/models', {
    method: 'GET',
    headers: getOpenRouterHeaders(apiKey),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Failed to fetch OpenRouter models (${response.status}): ${message}`);
  }

  const data = await response.json();
  const models = Array.isArray(data?.data) ? (data.data as OpenRouterModel[]) : [];

  const freeModelIds = models
    .filter((model) => supportsTextOutput(model) && isFreeModel(model))
    .map((model) => model.id)
    .sort((a, b) => a.localeCompare(b));

  if (freeModelIds.length > 0) {
    writeCachedModelIds(freeModelIds);
  }

  return freeModelIds;
}

interface OpenRouterRequest {
  model: string;
  messages: Array<{ role: string; content: string }>;
  temperature: number;
  max_tokens: number;
}

export async function requestOpenRouterCompletion(
  baseUrl: string,
  apiKey: string,
  request: OpenRouterRequest,
): Promise<Response> {
  const endpoint = `${baseUrl}/chat/completions`;
  const headers = getOpenRouterHeaders(apiKey);

  const attempts: Array<Record<string, unknown>> = [
    {
      ...request,
      response_format: { type: 'json_object' },
    },
    {
      ...request,
    },
    {
      model: request.model,
      messages: request.messages,
      max_tokens: request.max_tokens,
    },
    {
      model: request.model,
      messages: request.messages,
    },
  ];

  let lastResponse: Response | null = null;

  for (const body of attempts) {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (response.ok) return response;

    lastResponse = response;
    if (![400, 404, 422, 429, 500, 502, 503, 504].includes(response.status)) {
      return response;
    }

    logger.warn(`OpenRouter request failed with ${response.status}. Retrying with reduced parameters.`);
  }

  if (!lastResponse) {
    throw new Error('OpenRouter request failed before receiving a response.');
  }

  return lastResponse;
}
