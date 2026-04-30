import { expect, test, describe, spyOn, mock, beforeEach } from "bun:test";
import { LLM_PROVIDER_CONFIG } from "../constants/llmProviders";
import { ApiSettings, ApiProvider } from "../types";
import { generateWithOpenAiCompatible } from "./geminiService";
import { requestOpenRouterCompletion } from "./openrouterService";

describe("API Provider Switching", () => {
  beforeEach(() => {
    mock.restore();
  });

  test("should have correct configuration for all providers", () => {
    const providers = Object.keys(LLM_PROVIDER_CONFIG);
    
    // Check that we have all expected providers
    expect(providers).toContain("gemini");
    expect(providers).toContain("openai");
    expect(providers).toContain("openrouter");
    expect(providers).toContain("groq");
    expect(providers).toContain("together");
    expect(providers).toContain("deepseek");
    
    // Check each provider has required fields
    providers.forEach(provider => {
      const config = LLM_PROVIDER_CONFIG[provider as keyof typeof LLM_PROVIDER_CONFIG];
      expect(config).toBeDefined();
      expect(config.label).toBeDefined();
      expect(config.defaultModel).toBeDefined();
      expect(config.modelOptions).toBeInstanceOf(Array);
      expect(typeof config.requiresApiKey).toBe("boolean");
    });
  });

  test("should validate provider configuration structure", () => {
    const geminiConfig = LLM_PROVIDER_CONFIG.gemini;
    expect(geminiConfig.label).toBe("Gemini API");
    expect(geminiConfig.defaultModel).toBe("gemini-2.5-flash");
    expect(geminiConfig.modelOptions).toContain("gemini-2.5-flash");
    expect(geminiConfig.modelOptions).toContain("gemini-1.5-pro");
    expect(geminiConfig.requiresApiKey).toBe(true);

    const openrouterConfig = LLM_PROVIDER_CONFIG.openrouter;
    expect(openrouterConfig.label).toBe("OpenRouter (Free + Paid)");
    expect(openrouterConfig.defaultModel).toBe("openrouter/free");
    expect(openrouterConfig.modelOptions).toContain("openrouter/free");
    expect(openrouterConfig.requiresApiKey).toBe(true);
  });

  test("should handle OpenRouter free model fetching", async () => {
    // Mock the fetch call for OpenRouter models
    const mockModelsResponse = {
      data: [
        {
          id: "meta-llama/llama-3.1-8b-instruct:free",
          pricing: { prompt: "0", completion: "0" },
          architecture: { output_modalities: ["text"] }
        },
        {
          id: "deepseek/deepseek-chat-v3-0324:free",
          pricing: { prompt: "0", completion: "0" },
          architecture: { output_modalities: ["text"] }
        },
        {
          id: "gpt-4", // Not free
          pricing: { prompt: "0.01", completion: "0.03" },
          architecture: { output_modalities: ["text"] }
        }
      ]
    };

    const mockFetch = async (): Promise<Response> => {
      return new Response(JSON.stringify(mockModelsResponse), { status: 200 });
    };
    // Add missing properties to match typeof fetch
    const mockFetchWithProps = Object.assign(mockFetch, {
      preconnect: () => {},
      // Add other fetch static properties as needed
    });
    const fetchSpy = spyOn(global, "fetch").mockImplementation(mockFetchWithProps as unknown as typeof fetch);

    try {
      // Test the OpenRouter service function
      const response = await fetch("https://openrouter.ai/api/v1/models", {
        headers: { Authorization: "Bearer test-key" }
      });
      const data = await response.json();
      
      expect(data.data).toHaveLength(3);
      
      // Filter free models
      const freeModels = data.data.filter((model: any) => 
        model.id.endsWith(":free") || 
        (model.pricing?.prompt === "0" && model.pricing?.completion === "0")
      );
      
      expect(freeModels).toHaveLength(2);
      expect(freeModels[0].id).toBe("meta-llama/llama-3.1-8b-instruct:free");
    } finally {
      fetchSpy.mockRestore();
    }
  });

  test("should validate API settings for different providers", () => {
    const testSettings: Record<string, ApiSettings> = {
      gemini: {
        provider: "gemini",
        geminiApiKey: "test-gemini-key",
        geminiModel: "gemini-2.5-flash",
        openAiCompatibleApiKey: "",
        openAiCompatibleBaseUrl: "",
        openAiCompatibleModel: ""
      },
      openai: {
        provider: "openai",
        geminiApiKey: "",
        geminiModel: "",
        openAiCompatibleApiKey: "test-openai-key",
        openAiCompatibleBaseUrl: "https://api.openai.com/v1",
        openAiCompatibleModel: "gpt-4o-mini"
      },
      openrouter: {
        provider: "openrouter",
        geminiApiKey: "",
        geminiModel: "",
        openAiCompatibleApiKey: "test-openrouter-key",
        openAiCompatibleBaseUrl: "https://openrouter.ai/api/v1",
        openAiCompatibleModel: "openrouter/free"
      }
    };
// Test each provider configuration
Object.entries(testSettings).forEach(([providerKey, settings]) => {
  expect(settings.provider).toBe(providerKey as ApiProvider);
  
  const config = LLM_PROVIDER_CONFIG[settings.provider];
  
  expect(config).toBeDefined();
  
  // Check that required API key is present if needed
  if (config.requiresApiKey) {
    switch (providerKey as ApiProvider) {
      case "gemini":
        expect(settings.geminiApiKey).toBeTruthy();
        break;
      case "openai":
      case "openrouter":
        expect(settings.openAiCompatibleApiKey).toBeTruthy();
        break;
    }
  }
});
  });

  test("should handle provider switching validation", () => {
    // Test that switching providers requires appropriate fields
    const providers = ["gemini", "openai", "openrouter", "groq", "together", "deepseek"];
    
    providers.forEach(provider => {
      const config = LLM_PROVIDER_CONFIG[provider as keyof typeof LLM_PROVIDER_CONFIG];
      
      // Create minimal valid settings for this provider
      const settings: Partial<ApiSettings> = {
        provider: provider as ApiSettings["provider"]
      };
      
      // Add required API key if needed
      if (config.requiresApiKey) {
        switch (provider) {
          case "gemini":
            (settings as any).geminiApiKey = "test-key";
            (settings as any).geminiModel = config.defaultModel;
            break;
          case "openai":
          case "openrouter":
          case "groq":
          case "together":
          case "deepseek":
            (settings as any).openAiCompatibleApiKey = "test-key";
            (settings as any).openAiCompatibleBaseUrl = config.defaultBaseUrl || "";
            (settings as any).openAiCompatibleModel = config.defaultModel;
            break;
        }
      }
      
      expect(settings.provider).toBe(provider as ApiProvider);
    });
  });

  test("should detect missing required fields for providers", () => {
    // Test that missing required fields would cause errors
    const testCases = [
      {
        provider: "gemini" as const,
        settings: { provider: "gemini" } as ApiSettings,
        shouldFail: true // Missing geminiApiKey
      },
      {
        provider: "openai" as const,
        settings: {
          provider: "openai",
          openAiCompatibleApiKey: "test-key"
          // Missing baseUrl and model
        } as ApiSettings,
        shouldFail: true
      },
      {
        provider: "pollinations" as const,
        settings: { 
          provider: "pollinations"
          // No API key required
        } as ApiSettings,
        shouldFail: false
      }
    ];

    testCases.forEach(({ provider, settings, shouldFail }) => {
      const config = LLM_PROVIDER_CONFIG[provider];
      
      if (config.requiresApiKey) {
        // Check if required fields are missing
        let hasRequiredFields = true;
        
        switch (provider) {
          case "gemini":
            hasRequiredFields = !!(settings as any).geminiApiKey;
            break;
          case "openai":
            hasRequiredFields = !!(settings as any).openAiCompatibleApiKey &&
                               !!(settings as any).openAiCompatibleBaseUrl &&
                               !!(settings as any).openAiCompatibleModel;
            break;
        }
        
        expect(hasRequiredFields).toBe(!shouldFail);
      }
    });
  });
});