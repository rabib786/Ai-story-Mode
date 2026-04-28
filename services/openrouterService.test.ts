import { describe, expect, test } from 'bun:test';
import { listOpenRouterFreeModelIds } from './openrouterService';

describe('openrouterService', () => {
  test('filters free, text-capable models', async () => {
    const originalFetch = global.fetch;

    global.fetch = (async () => {
      return {
        ok: true,
        json: async () => ({
          data: [
            {
              id: 'alpha/model-a:free',
              architecture: { output_modalities: ['text'] },
              pricing: { prompt: '0.0001', completion: '0.0002' },
            },
            {
              id: 'alpha/model-b',
              architecture: { output_modalities: ['text'] },
              pricing: { prompt: '0', completion: '0', request: '0', internal_reasoning: '0', web_search: '0' },
            },
            {
              id: 'alpha/model-c',
              architecture: { output_modalities: ['image'] },
              pricing: { prompt: '0', completion: '0' },
            },
          ],
        }),
      } as any;
    }) as any;

    const ids = await listOpenRouterFreeModelIds('test-key', true);
    expect(ids).toEqual(['alpha/model-a:free', 'alpha/model-b']);

    global.fetch = originalFetch;
  });
});
