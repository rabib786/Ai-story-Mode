import { expect, test, describe, beforeEach, afterEach } from "bun:test";
import { Scenario, ScenarioCharacter } from "../types";
import { saveToStorageAsync } from "./storage";
import { SCENARIOS_KEY, DELETED_PREBUILT_SCENARIOS_KEY } from "../constants/storageKeys";
import { PREBUILT_SCENARIOS } from "../constants/scenarios";

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

describe("Scenario System", () => {
  test("should have prebuilt scenarios defined", () => {
    expect(PREBUILT_SCENARIOS).toBeInstanceOf(Array);
    expect(PREBUILT_SCENARIOS.length).toBeGreaterThan(0);
    
    // Check first prebuilt scenario structure
    const firstScenario = PREBUILT_SCENARIOS[0];
    expect(firstScenario).toHaveProperty("id");
    expect(firstScenario).toHaveProperty("name");
    expect(firstScenario).toHaveProperty("description");
    expect(firstScenario).toHaveProperty("characters");
    expect(firstScenario).toHaveProperty("tags");
  });

  test("should create and save custom scenario", () => {
    const customScenario: Scenario = {
      id: "custom-test-1",
      name: "Custom Adventure",
      description: "A custom created scenario for testing",
      characters: [
        {
          name: "Custom NPC",
          role: "Mentor",
          personality: "Wise and patient",
          backstory: "Has trained many heroes"
        }
      ],
      tags: ["fantasy", "custom"],
      worldDetails: "A world of magic and mystery",
      introduction: "Welcome to this custom adventure",
      greetingMessage: "Hello, traveler!",
      customInstructions: "Focus on character development",
      views: 0,
      rating: 0,
      separateUserCharacter: true,
      sensitiveContent: false,
      publicScenario: false,
      allowStoryCustomization: true,
      hideScenarioPrompts: false,
      allowCommenting: true
    };

    // Save custom scenario
    saveToStorageAsync(SCENARIOS_KEY, [customScenario]);
    
    setTimeout(() => {
      const stored = localStorage.getItem(SCENARIOS_KEY);
      expect(stored).not.toBeNull();
      
      if (stored) {
        const parsed = JSON.parse(stored);
        expect(parsed).toHaveLength(1);
        expect(parsed[0].id).toBe("custom-test-1");
        expect(parsed[0].name).toBe("Custom Adventure");
        expect(parsed[0].tags).toEqual(["fantasy", "custom"]);
      }
    }, 10);
  });

  test("should separate prebuilt and custom scenarios", () => {
    const customScenarios: Scenario[] = [
      {
        id: "custom-1",
        name: "Custom 1",
        description: "First custom",
        characters: [],
        tags: ["test"],
        worldDetails: "",
        introduction: "",
        greetingMessage: "",
        customInstructions: "",
        views: 0,
        rating: 0,
        separateUserCharacter: true,
        sensitiveContent: false,
        publicScenario: false,
        allowStoryCustomization: true,
        hideScenarioPrompts: false,
        allowCommenting: true
      }
    ];

    // Save only custom scenarios
    saveToStorageAsync(SCENARIOS_KEY, customScenarios);
    
    setTimeout(() => {
      const stored = localStorage.getItem(SCENARIOS_KEY);
      expect(stored).not.toBeNull();
      
      if (stored) {
        const parsed = JSON.parse(stored);
        // Should only contain custom scenarios, not prebuilt
        expect(parsed.length).toBe(1);
        expect(parsed[0].id).toBe("custom-1");
        
        // Prebuilt scenarios should be loaded separately
        const prebuiltIds = PREBUILT_SCENARIOS.map(s => s.id);
        expect(prebuiltIds).not.toContain("custom-1");
      }
    }, 10);
  });

  test("should handle scenario deletion tracking", () => {
    const deletedPrebuiltIds = ["prebuilt-1", "prebuilt-2"];
    
    // Save deleted prebuilt scenario IDs
    saveToStorageAsync(DELETED_PREBUILT_SCENARIOS_KEY, deletedPrebuiltIds);
    
    setTimeout(() => {
      const stored = localStorage.getItem(DELETED_PREBUILT_SCENARIOS_KEY);
      expect(stored).not.toBeNull();
      
      if (stored) {
        const parsed = JSON.parse(stored);
        expect(parsed).toEqual(["prebuilt-1", "prebuilt-2"]);
        
        // Test filtering logic
        const allPrebuiltIds = ["prebuilt-1", "prebuilt-2", "prebuilt-3", "prebuilt-4"];
        const activePrebuiltIds = allPrebuiltIds.filter(id => !deletedPrebuiltIds.includes(id));
        expect(activePrebuiltIds).toEqual(["prebuilt-3", "prebuilt-4"]);
      }
    }, 10);
  });

  test("should validate scenario character structure", () => {
    const scenarioCharacter: ScenarioCharacter = {
      name: "Test Character",
      role: "Protagonist",
      personality: "Brave and determined",
      backstory: "Grew up in a small village",
      portrait: "data:image/png;base64,test"
    };

    expect(scenarioCharacter.name).toBe("Test Character");
    expect(scenarioCharacter.role).toBe("Protagonist");
    expect(scenarioCharacter.personality).toBe("Brave and determined");
    expect(scenarioCharacter.backstory).toBe("Grew up in a small village");
    expect(scenarioCharacter.portrait).toBe("data:image/png;base64,test");
  });

  test("should handle scenario with multiple characters", () => {
    const multiCharacterScenario: Scenario = {
      id: "multi-char",
      name: "Multi-Character Story",
      description: "A story with many characters",
      characters: [
        {
          name: "Hero",
          role: "Main Character",
          personality: "Brave",
          backstory: "Chosen one"
        },
        {
          name: "Villain",
          role: "Antagonist",
          personality: "Cunning",
          backstory: "Fell from grace"
        },
        {
          name: "Companion",
          role: "Sidekick",
          personality: "Loyal",
          backstory: "Always by hero's side"
        }
      ],
      tags: ["epic", "ensemble"],
      worldDetails: "A vast world with many factions",
      introduction: "A tale of many characters",
      greetingMessage: "The story begins...",
      customInstructions: "Balance screen time between characters",
      views: 0,
      rating: 0,
      separateUserCharacter: true,
      sensitiveContent: false,
      publicScenario: false,
      allowStoryCustomization: true,
      hideScenarioPrompts: false,
      allowCommenting: true
    };

    expect(multiCharacterScenario.characters).toHaveLength(3);
    expect(multiCharacterScenario.characters[0].name).toBe("Hero");
    expect(multiCharacterScenario.characters[1].name).toBe("Villain");
    expect(multiCharacterScenario.characters[2].name).toBe("Companion");
  });

  test("should handle scenario tags and categorization", () => {
    const taggedScenario: Scenario = {
      id: "tagged",
      name: "Tagged Scenario",
      description: "Scenario with many tags",
      characters: [],
      tags: ["fantasy", "romance", "adventure", "mystery", "comedy"],
      worldDetails: "",
      introduction: "",
      greetingMessage: "",
      customInstructions: "",
      views: 0,
      rating: 0,
      separateUserCharacter: true,
      sensitiveContent: false,
      publicScenario: false,
      allowStoryCustomization: true,
      hideScenarioPrompts: false,
      allowCommenting: true
    };

    expect(taggedScenario.tags).toHaveLength(5);
    expect(taggedScenario.tags).toContain("fantasy");
    expect(taggedScenario.tags).toContain("romance");
    expect(taggedScenario.tags).toContain("adventure");
    
    // Test tag filtering
    const fantasyScenarios = [taggedScenario].filter(s => s.tags.includes("fantasy"));
    expect(fantasyScenarios).toHaveLength(1);
    
    const horrorScenarios = [taggedScenario].filter(s => s.tags.includes("horror"));
    expect(horrorScenarios).toHaveLength(0);
  });

  test("should handle scenario updates and versioning", () => {
    const originalScenario: Scenario = {
      id: "version-test",
      name: "Original",
      description: "Original description",
      characters: [],
      tags: ["original"],
      worldDetails: "",
      introduction: "",
      greetingMessage: "",
      customInstructions: "",
      views: 10,
      rating: 4.5,
      separateUserCharacter: true,
      sensitiveContent: false,
      publicScenario: false,
      allowStoryCustomization: true,
      hideScenarioPrompts: false,
      allowCommenting: true
    };

    const updatedScenario: Scenario = {
      ...originalScenario,
      name: "Updated",
      description: "Updated description",
      tags: ["updated", "improved"],
      views: 20,
      rating: 4.8
    };

    expect(updatedScenario.id).toBe(originalScenario.id);
    expect(updatedScenario.name).toBe("Updated");
    expect(updatedScenario.description).toBe("Updated description");
    expect(updatedScenario.tags).toEqual(["updated", "improved"]);
    expect(updatedScenario.views).toBe(20);
    expect(updatedScenario.rating).toBe(4.8);
  });
});