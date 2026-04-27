import { ApiProvider } from "../types";

export interface ProviderConfig {
  label: string;
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
    defaultBaseUrl: "https://api.openai.com/v1",
    defaultModel: "gpt-4o-mini",
    modelOptions: ["gpt-4o-mini", "gpt-4.1-mini", "gpt-4.1-nano"],
    requiresApiKey: true,
  },
  openrouter: {
    label: "OpenRouter (Free + Paid)",
    defaultBaseUrl: "https://openrouter.ai/api/v1",
    defaultModel: "meta-llama/llama-3.1-8b-instruct:free",
    modelOptions: [
      "meta-llama/llama-3.1-8b-instruct:free",
      "deepseek/deepseek-chat-v3-0324:free",
      "google/gemma-3-27b-it:free",
      "qwen/qwen3-30b-a3b:free",
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
  ollama: {
    label: "Ollama (Local / Free)",
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

const PROVIDER_ALIASES: Record<string, ApiProvider> = {
  "openai-compatible": "custom",
};

export function normalizeApiProvider(provider: unknown): ApiProvider {
  if (typeof provider !== "string") return "gemini";
  const normalized = PROVIDER_ALIASES[provider] || provider;
  if (normalized in LLM_PROVIDER_CONFIG) {
    return normalized as ApiProvider;
  }
  return "gemini";
}
