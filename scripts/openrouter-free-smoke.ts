const apiKey = process.env.OPENROUTER_API_KEY?.trim();

if (!apiKey) {
  console.error('Missing OPENROUTER_API_KEY.');
  process.exit(1);
}

type Model = {
  id: string;
  pricing?: Record<string, string>;
  architecture?: { output_modalities?: string[] };
};

function isZero(value?: string): boolean {
  return (value || '0') === '0';
}

function isFree(model: Model): boolean {
  if (model.id.endsWith(':free')) return true;
  const p = model.pricing || {};
  return isZero(p.prompt) && isZero(p.completion) && isZero(p.request) && isZero(p.internal_reasoning) && isZero(p.web_search);
}

function supportsText(model: Model): boolean {
  const modalities = model.architecture?.output_modalities;
  return !modalities || modalities.includes('text');
}

async function fetchFreeModels(): Promise<string[]> {
  const res = await fetch('https://openrouter.ai/api/v1/models', {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) {
    throw new Error(`Failed to list models: ${res.status} ${await res.text()}`);
  }

  const payload = await res.json();
  const models: Model[] = Array.isArray(payload?.data) ? payload.data : [];
  return models.filter((m) => supportsText(m) && isFree(m)).map((m) => m.id).sort();
}

async function run() {
  const models = await fetchFreeModels();
  console.log(`Found ${models.length} free text models.`);

  const failed: Array<{ model: string; reason: string }> = [];

  for (const model of models) {
    const body = {
      model,
      messages: [{ role: 'user', content: 'Reply with valid JSON: {"ok":true,"model":"<id>"}' }],
      max_tokens: 120,
      response_format: { type: 'json_object' },
    };

    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      failed.push({ model, reason: `${res.status} ${await res.text()}` });
      console.log(`✗ ${model}`);
      continue;
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
      failed.push({ model, reason: 'empty content' });
      console.log(`✗ ${model}`);
      continue;
    }

    console.log(`✓ ${model}`);
  }

  if (failed.length > 0) {
    console.error('\nFailures:');
    for (const item of failed) {
      console.error(`- ${item.model}: ${item.reason}`);
    }
    process.exit(1);
  }

  console.log('\nAll free models returned content successfully.');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
