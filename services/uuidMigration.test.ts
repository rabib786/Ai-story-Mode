import { expect, test, describe, beforeEach } from "bun:test";
import { isValidUuid, migrateScenarioId, UUID_REGEX } from "./storyUtils";

describe("UUID Utilities", () => {
  const validUuid = "123e4567-e89b-12d3-a456-426614174000";

  describe("isValidUuid", () => {
    test("should validate standard UUID", () => {
      expect(isValidUuid(validUuid)).toBe(true);
    });

    test("should validate UUID with different cases", () => {
      expect(isValidUuid(validUuid.toUpperCase())).toBe(true);
    });

    test("should validate UUID with leading/trailing whitespace", () => {
      expect(isValidUuid(`  ${validUuid}  `)).toBe(true);
    });

    test("should invalidate non-UUID strings", () => {
      expect(isValidUuid("not-a-uuid")).toBe(false);
      expect(isValidUuid("12345")).toBe(false);
      expect(isValidUuid("")).toBe(false);
    });
  });

  describe("migrateScenarioId", () => {
    // Mock crypto.randomUUID for deterministic testing
    beforeEach(() => {
        global.crypto = {
            randomUUID: () => 'mocked-uuid'
        } as any;
    });

    test("should preserve valid custom-prefixed UUID", () => {
      const id = `custom-${validUuid}`;
      const { migratedId, wasUpdated } = migrateScenarioId(id);
      expect(migratedId).toBe(id);
      expect(wasUpdated).toBe(false);
    });

    test("should normalize custom-prefixed UUID (whitespace and case)", () => {
      const id = `  CUSTOM-${validUuid.toUpperCase()}  `;
      const { migratedId, wasUpdated } = migrateScenarioId(id);
      expect(migratedId).toBe(`custom-${validUuid.toLowerCase()}`);
      expect(wasUpdated).toBe(true);
    });

    test("should add custom- prefix to plain UUID", () => {
      const { migratedId, wasUpdated } = migrateScenarioId(validUuid);
      expect(migratedId).toBe(`custom-${validUuid}`);
      expect(wasUpdated).toBe(true);
    });

    test("should add custom- prefix and normalize plain UUID", () => {
        const { migratedId, wasUpdated } = migrateScenarioId(`  ${validUuid.toUpperCase()}  `);
        expect(migratedId).toBe(`custom-${validUuid.toLowerCase()}`);
        expect(wasUpdated).toBe(true);
    });

    test("should generate new UUID for invalid IDs", () => {
      const { migratedId, wasUpdated } = migrateScenarioId("invalid-id");
      expect(migratedId).toBe("custom-mocked-uuid");
      expect(wasUpdated).toBe(true);
    });

    test("should handle empty or null IDs", () => {
        expect(migrateScenarioId("").migratedId).toBe("custom-mocked-uuid");
        expect(migrateScenarioId(null as any).migratedId).toBe("custom-mocked-uuid");
    });
  });
});
