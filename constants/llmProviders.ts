import { ApiProvider } from "../types";

export interface ProviderConfig {
  label: string;
  description?: string;
  defaultBaseUrl?: string;
  defaultModel: string;
  modelOptions: string[];
  requiresApiKey: boolean;
}

export const LLM_PROVIDER_CONFIG: Record<ApiProvider, ProviderConfig> = {
  gemini: {
    label: "Gemini API",
    defaultModel: "gemini-2.5-flash",
    modelOptions: ["gemini-2.5-flash", "gemini-1.5-pro"],
    requiresApiKey: true,
  },
  openai: {
    label: "OpenAI",
    description: "Official OpenAI API",
    defaultBaseUrl: "https://api.openai.com/v1",
    defaultModel: "gpt-4o-mini",
    modelOptions: ["gpt-4o-mini", "gpt-4.1-mini", "gpt-4.1-nano", "gpt-4o"],
    requiresApiKey: true,
  },
  openrouter: {
    label: "OpenRouter (Free + Paid)",
    description: "Dynamic free-model list + router fallback",
    defaultBaseUrl: "https://openrouter.ai/api/v1",
    defaultModel: "openrouter/free",
    modelOptions: [
      "openrouter/free",
      "meta-llama/llama-3.1-8b-instruct:free",
      "deepseek/deepseek-chat-v3-0324:free",
    ],
    requiresApiKey: true,
  },
  groq: {
    label: "Groq",
    defaultBaseUrl: "https://api.groq.com/openai/v1",
    defaultModel: "llama-3.1-8b-instant",
    modelOptions: ["llama-3.1-8b-instant", "llama-3.3-70b-versatile", "mixtral-8x7b-32768"],
    requiresApiKey: true,
  },
  together: {
    label: "Together AI",
    defaultBaseUrl: "https://api.together.xyz/v1",
    defaultModel: "meta-llama/Llama-3.1-8B-Instruct-Turbo",
    modelOptions: ["meta-llama/Llama-3.1-8B-Instruct-Turbo", "Qwen/Qwen2.5-7B-Instruct-Turbo"],
    requiresApiKey: true,
  },
  deepseek: {
    label: "DeepSeek",
    defaultBaseUrl: "https://api.deepseek.com/v1",
    defaultModel: "deepseek-chat",
    modelOptions: ["deepseek-chat", "deepseek-reasoner"],
    requiresApiKey: true,
  },
  cerebras: {
    label: "Cerebras",
    defaultBaseUrl: "https://api.cerebras.ai/v1",
    defaultModel: "llama-3.3-70b",
    modelOptions: ["llama-3.3-70b", "qwen-3-32b"],
    requiresApiKey: true,
  },
  sambanova: {
    label: "SambaNova",
    defaultBaseUrl: "https://api.sambanova.ai/v1",
    defaultModel: "Meta-Llama-3.3-70B-Instruct",
    modelOptions: ["Meta-Llama-3.3-70B-Instruct", "Qwen2.5-72B-Instruct"],
    requiresApiKey: true,
  },
  fireworks: {
    label: "Fireworks AI",
    defaultBaseUrl: "https://api.fireworks.ai/inference/v1",
    defaultModel: "accounts/fireworks/models/llama-v3p1-8b-instruct",
    modelOptions: [
      "accounts/fireworks/models/llama-v3p1-8b-instruct",
      "accounts/fireworks/models/qwen3-30b-a3b",
    ],
    requiresApiKey: true,
  },
  mistral: {
    label: "Mistral API",
    defaultBaseUrl: "https://api.mistral.ai/v1",
    defaultModel: "mistral-small-latest",
    modelOptions: ["mistral-small-latest", "open-mistral-nemo", "ministral-8b-latest"],
    requiresApiKey: true,
  },
  xai: {
    label: "xAI (Grok)",
    defaultBaseUrl: "https://api.x.ai/v1",
    defaultModel: "grok-3-mini",
    modelOptions: ["grok-3-mini", "grok-3", "grok-2-1212"],
    requiresApiKey: true,
  },
  pollinations: {
    label: "Pollinations (Hosted Free)",
    description: "Free hosted OpenAI-compatible endpoint (no API key required)",
    defaultBaseUrl: "https://text.pollinations.ai/openai",
    defaultModel: "openai-large",
    modelOptions: ["openai-large", "openai", "mistral", "llama"],
    requiresApiKey: false,
  },
  lmstudio: {
    label: "LM Studio (Local / Free)",
    description: "Use local models served from LM Studio's OpenAI-compatible API",
    defaultBaseUrl: "http://localhost:1234/v1",
    defaultModel: "local-model",
    modelOptions: ["local-model"],
    requiresApiKey: false,
  },
  ollama: {
    label: "Ollama (Local / Free)",
    description: "Run fully local models on your own machine",
    defaultBaseUrl: "http://localhost:11434/v1",
    defaultModel: "llama3.1:8b",
    modelOptions: ["llama3.1:8b", "qwen2.5:7b", "mistral:7b-instruct"],
    requiresApiKey: false,
  },
  custom: {
    label: "Custom OpenAI-Compatible",
    defaultBaseUrl: "https://api.openai.com/v1",
    defaultModel: "gpt-4o-mini",
    modelOptions: [],
    requiresApiKey: true,
  },
};
