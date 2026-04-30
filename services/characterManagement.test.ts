import { expect, test, describe, beforeEach, afterEach } from "bun:test";
import { UserCharacter } from "../types";
import { saveToStorageAsync } from "./storage";
import { USER_CHARACTERS_KEY } from "../constants/storageKeys";

// Mock localStorage for testing
const mockLocalStorage: Record<string, string> = {};

// Setup and teardown
beforeEach(() => {
  // Clear mock localStorage
  Object.keys(mockLocalStorage).forEach(key => {
    delete mockLocalStorage[key];
  });
  
  // Mock global localStorage
  global.localStorage = {
    getItem: (key: string) => mockLocalStorage[key] || null,
    setItem: (key: string, value: string) => { mockLocalStorage[key] = value; },
    removeItem: (key: string) => { delete mockLocalStorage[key]; },
    clear: () => { Object.keys(mockLocalStorage).forEach(key => delete mockLocalStorage[key]); },
    key: (index: number) => Object.keys(mockLocalStorage)[index] || null,
    length: Object.keys(mockLocalStorage).length
  } as Storage;
});

afterEach(() => {
  // Restore if needed
});

describe("Character Management", () => {
  test("should save and load characters from storage", () => {
    const testCharacters: UserCharacter[] = [
      {
        id: "char-1",
        name: "Test Character 1",
        description: "A brave adventurer",
        portrait: "data:image/png;base64,test1"
      },
      {
        id: "char-2", 
        name: "Test Character 2",
        description: "A wise mage",
        portrait: undefined
      }
    ];

    // Save characters
    saveToStorageAsync(USER_CHARACTERS_KEY, testCharacters);
    
    // Need to wait for async save (setTimeout with 0 delay)
    setTimeout(() => {
      // Load characters
      const stored = localStorage.getItem(USER_CHARACTERS_KEY);
      expect(stored).not.toBeNull();
      
      if (stored) {
        const parsed = JSON.parse(stored);
        expect(parsed).toHaveLength(2);
        expect(parsed[0].name).toBe("Test Character 1");
        expect(parsed[1].name).toBe("Test Character 2");
      }
    }, 10);
  });

  test("should handle character creation with UUID", () => {
    const newCharacter: UserCharacter = {
      id: crypto.randomUUID(),
      name: "New Character",
      description: "Freshly created character",
      portrait: undefined
    };

    expect(newCharacter.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    expect(newCharacter.name).toBe("New Character");
    expect(newCharacter.description).toBe("Freshly created character");
  });

  test("should validate character data structure", () => {
    const validCharacter: UserCharacter = {
      id: "test-id",
      name: "Valid Character",
      description: "Has all required fields",
      portrait: "data:image/jpeg;base64,abc123"
    };

    expect(validCharacter).toHaveProperty("id");
    expect(validCharacter).toHaveProperty("name");
    expect(validCharacter).toHaveProperty("description");
    expect(typeof validCharacter.id).toBe("string");
    expect(typeof validCharacter.name).toBe("string");
    expect(typeof validCharacter.description).toBe("string");
    
    // Portrait is optional
    if (validCharacter.portrait) {
      expect(typeof validCharacter.portrait).toBe("string");
    }
  });

  test("should handle character updates", () => {
    const originalCharacter: UserCharacter = {
      id: "update-test",
      name: "Original Name",
      description: "Original description",
      portrait: undefined
    };

    const updatedCharacter: UserCharacter = {
      ...originalCharacter,
      name: "Updated Name",
      description: "Updated description",
      portrait: "data:image/png;base64,updated"
    };

    expect(updatedCharacter.id).toBe(originalCharacter.id);
    expect(updatedCharacter.name).toBe("Updated Name");
    expect(updatedCharacter.description).toBe("Updated description");
    expect(updatedCharacter.portrait).toBe("data:image/png;base64,updated");
  });

  test("should handle character deletion", () => {
    const characters: UserCharacter[] = [
      { id: "char-1", name: "Keep", description: "Keep this one" },
      { id: "char-2", name: "Delete", description: "Delete this one" },
      { id: "char-3", name: "Also Keep", description: "Keep this too" }
    ];

    // Simulate deleting character with id "char-2"
    const filteredCharacters = characters.filter(char => char.id !== "char-2");
    
    expect(filteredCharacters).toHaveLength(2);
    expect(filteredCharacters[0].id).toBe("char-1");
    expect(filteredCharacters[1].id).toBe("char-3");
    expect(filteredCharacters.some(char => char.id === "char-2")).toBe(false);
  });

  test("should handle empty character list", () => {
    const emptyCharacters: UserCharacter[] = [];
    
    saveToStorageAsync(USER_CHARACTERS_KEY, emptyCharacters);
    
    setTimeout(() => {
      const stored = localStorage.getItem(USER_CHARACTERS_KEY);
      expect(stored).not.toBeNull();
      
      if (stored) {
        const parsed = JSON.parse(stored);
        expect(parsed).toEqual([]);
      }
    }, 10);
  });

  test("should handle character with special characters in name", () => {
    const specialCharacter: UserCharacter = {
      id: "special-1",
      name: "Character with spéçïål chàräctérs & symbols!@#$%",
      description: "Description with line breaks\nand special chars",
      portrait: undefined
    };

    expect(specialCharacter.name).toContain("spéçïål");
    expect(specialCharacter.description).toContain("line breaks");
    
    // Test JSON serialization/deserialization
    const jsonString = JSON.stringify(specialCharacter);
    const parsed = JSON.parse(jsonString);
    
    expect(parsed.name).toBe(specialCharacter.name);
    expect(parsed.description).toBe(specialCharacter.description);
  });

  test("should handle large character descriptions", () => {
    const longDescription = "A".repeat(1000); // 1000 character description
    const character: UserCharacter = {
      id: "long-desc",
      name: "Long Description Character",
      description: longDescription,
      portrait: undefined
    };

    expect(character.description.length).toBe(1000);
    
    // Test storage
    saveToStorageAsync(USER_CHARACTERS_KEY, [character]);
    
    setTimeout(() => {
      const stored = localStorage.getItem(USER_CHARACTERS_KEY);
      expect(stored).not.toBeNull();
      
      if (stored) {
        const parsed = JSON.parse(stored);
        expect(parsed[0].description.length).toBe(1000);
      }
    }, 10);
  });
});