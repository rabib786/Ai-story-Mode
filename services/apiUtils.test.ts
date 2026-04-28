import { describe, expect, test, mock, afterEach, beforeEach, jest } from "bun:test";
import { withRetry, validateProvider, ApiError } from "./apiUtils";
import { ApiSettings } from "../types";

describe("apiUtils", () => {
    describe("withRetry", () => {
        beforeEach(() => {
            // Mock setTimeout to advance immediately for fast tests
            mock.module('timers', () => {
                return {
                    setTimeout: (fn: Function) => fn()
                }
            });
            globalThis.setTimeout = ((fn: Function) => fn()) as any;
        });

        afterEach(() => {
            mock.restore();
        });

        test("should succeed on first try if no error", async () => {
            const operation = mock(() => Promise.resolve("success"));
            const result = await withRetry(operation, "testProvider");
            expect(result).toBe("success");
            expect(operation).toHaveBeenCalledTimes(1);
        });

        test("should retry on 429 error and succeed", async () => {
             let attempts = 0;
             const operation = mock(async () => {
                 attempts++;
                 if (attempts === 1) {
                     const error: any = new Error("Rate limit");
                     error.status = 429;
                     throw error;
                 }
                 return "success";
             });

             const result = await withRetry(operation, "testProvider", 3, 0);
             expect(result).toBe("success");
             expect(operation).toHaveBeenCalledTimes(2);
        });

        test("should throw ApiError on non-retryable 401 error immediately", async () => {
            const operation = mock(async () => {
                const error: any = new Error("Unauthorized");
                error.status = 401;
                throw error;
            });

            try {
                 await withRetry(operation, "testProvider", 3, 0);
                 expect(true).toBe(false); // Should not reach here
            } catch(e: any) {
                 expect(e).toBeInstanceOf(ApiError);
                 expect(e.code).toBe("AUTH_ERROR");
                 expect(e.statusCode).toBe(401);
            }
            expect(operation).toHaveBeenCalledTimes(1);
        });

         test("should throw ApiError with TIMEOUT_ERROR after max retries", async () => {
             const operation = mock(async () => {
                 const error: any = new Error("Failed to fetch");
                 error.name = "TypeError"; // standard network error
                 throw error;
             });

             try {
                  await withRetry(operation, "testProvider", 2, 0);
                  expect(true).toBe(false); // Should not reach here
             } catch(e: any) {
                  expect(e).toBeInstanceOf(ApiError);
                  expect(e.code).toBe("TIMEOUT_ERROR");
             }
             expect(operation).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
         });
    });

    describe("validateProvider", () => {
         test("should invalidate gemini without api key", async () => {
             const settings: ApiSettings = { provider: 'gemini', geminiApiKey: '', geminiModel: '', openAiCompatibleApiKey: '', openAiCompatibleBaseUrl: '', openAiCompatibleModel: '' };
             const result = await validateProvider(settings);
             expect(result.isValid).toBe(false);
             expect(result.error).toContain("API Key is required");
         });

         test("should validate gemini with proper api key", async () => {
              const settings: ApiSettings = { provider: 'gemini', geminiApiKey: '1234567890_VALID', geminiModel: '', openAiCompatibleApiKey: '', openAiCompatibleBaseUrl: '', openAiCompatibleModel: '' };
              const result = await validateProvider(settings);
              expect(result.isValid).toBe(true);
         });

         test("should invalidate openAi compatible without api key if required", async () => {
             const settings: ApiSettings = { provider: 'openrouter', geminiApiKey: '', geminiModel: '', openAiCompatibleApiKey: '', openAiCompatibleBaseUrl: 'url', openAiCompatibleModel: 'model' };
             const result = await validateProvider(settings);
             expect(result.isValid).toBe(false);
         });
    });
});
