import { expect, test, describe, spyOn } from "bun:test";
import { parseApiResponse, parseNarrative } from "./storyUtils";
import { GenerateContentResponse } from "@google/genai";

describe("storyUtils", () => {
  describe("parseApiResponse", () => {
    test("should successfully parse a valid JSON response", () => {
      const mockResponse: GenerateContentResponse = {
        text: JSON.stringify({
          narrative: "The story continues...",
          suggested_actions: ["Action 1", "Action 2"],
          memory_additions: ["Fact 1"],
          dominant_emotion: "joy"
        }),
        // Add other required fields of GenerateContentResponse if necessary,
        // though parseApiResponse only uses .text
      } as any;

      const result = parseApiResponse(mockResponse);

      expect(result).toEqual({
        narrative: "The story continues...",
        suggestedActions: ["Action 1", "Action 2"],
        memoryAdditions: ["Fact 1"],
        dominantEmotion: "joy"
      });
    });

    test("should use default values for missing optional fields", () => {
      const mockResponse: GenerateContentResponse = {
        text: JSON.stringify({
          narrative: "Partial response"
        }),
      } as any;

      const result = parseApiResponse(mockResponse);

      expect(result).toEqual({
        narrative: "Partial response",
        suggestedActions: [],
        memoryAdditions: [],
        dominantEmotion: "neutral"
      });
    });

    test("should return null and log error if response text is empty", () => {
      const mockResponse: GenerateContentResponse = {
        text: ""
      } as any;

      // Capture and silence console.error for this test
      const errorSpy = spyOn(console, 'error').mockImplementation(() => {});
      errorSpy.mockClear();

      const result = parseApiResponse(mockResponse);

      expect(result).toBeNull();

      expect(errorSpy).toHaveBeenCalledWith(
        "AI response text is empty or undefined. Full response:",
        '{\n  "text": ""\n}'
      );
    });

    test("should return null and log error if JSON is invalid", () => {
      const mockResponse = {
        text: "Invalid JSON"
      } as GenerateContentResponse;

      // Capture and silence console.error for this test
      const errorSpy = spyOn(console, 'error').mockImplementation(() => {});
      errorSpy.mockClear();

      const result = parseApiResponse(mockResponse);

      expect(result).toBeNull();
      expect(errorSpy).toHaveBeenCalled();

      expect(errorSpy).toHaveBeenCalledWith(
        "Failed to parse model JSON response. Full response object:",
        mockResponse,
        "Error:",
        expect.any(Error)
      );
    });
  });

  describe("parseNarrative", () => {
    test("should return empty array for empty input", () => {
      expect(parseNarrative("")).toEqual([]);
    });

    test("should parse plain text without tags", () => {
      const input = "This is a simple narrative.";
      expect(parseNarrative(input)).toEqual([
        { type: "text", content: "This is a simple narrative." }
      ]);
    });

    test("should parse text with a single dialogue tag", () => {
      const input = "She said, <dialogue>Hello there!</dialogue>";
      expect(parseNarrative(input)).toEqual([
        { type: "text", content: "She said, " },
        { type: "dialogue", content: "Hello there!" }
      ]);
    });

    test("should parse text with multiple dialogue tags", () => {
      const input = "<dialogue>First.</dialogue> Then <dialogue>Second.</dialogue>";
      expect(parseNarrative(input)).toEqual([
        { type: "dialogue", content: "First." },
        { type: "text", content: " Then " },
        { type: "dialogue", content: "Second." }
      ]);
    });

    test("should handle dialogue at the end of the string", () => {
        const input = "He shouted <dialogue>Wait!</dialogue>";
        expect(parseNarrative(input)).toEqual([
          { type: "text", content: "He shouted " },
          { type: "dialogue", content: "Wait!" }
        ]);
    });
  });
});
