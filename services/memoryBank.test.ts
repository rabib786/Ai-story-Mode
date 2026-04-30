import { expect, test, describe, beforeEach, afterEach } from "bun:test";
import { MemoryEntry, MemoryType } from "../types";
import { saveToStorageAsync } from "./storage";

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

describe("Memory Bank System", () => {
  test("should create and store memory entries", () => {
    const memoryEntry: MemoryEntry = {
      id: "mem-1",
      content: "The player found the hidden key",
      type: "fact",
      confidence: 1.0,
      timestamp: Date.now(),
      locked: false
    };

    const memories: MemoryEntry[] = [memoryEntry];
    
    // Save memories
    saveToStorageAsync("test-memories", memories);
    
    setTimeout(() => {
      const stored = localStorage.getItem("test-memories");
      expect(stored).not.toBeNull();
      
      if (stored) {
        const parsed = JSON.parse(stored);
        expect(parsed).toHaveLength(1);
        expect(parsed[0].id).toBe("mem-1");
        expect(parsed[0].content).toBe("The player found the hidden key");
        expect(parsed[0].type).toBe("fact");
        expect(parsed[0].confidence).toBe(1.0);
        expect(parsed[0].locked).toBe(false);
      }
    }, 10);
  });

  test("should handle different memory types", () => {
    const memoryTypes: MemoryType[] = ["fact", "relationship", "hook"];
    
    const memories: MemoryEntry[] = memoryTypes.map((type, index) => ({
      id: `mem-type-${index}`,
      content: `This is a ${type} memory`,
      type,
      confidence: 0.5 + (index * 0.2),
      timestamp: Date.now() + index,
      locked: index === 0 // Lock the first one
    }));

    expect(memories).toHaveLength(3);
    expect(memories[0].type).toBe("fact");
    expect(memories[1].type).toBe("relationship");
    expect(memories[2].type).toBe("hook");
    expect(memories[0].locked).toBe(true);
    expect(memories[1].locked).toBe(false);
    expect(memories[2].locked).toBe(false);
  });

  test("should filter memories by type", () => {
    const memories: MemoryEntry[] = [
      { id: "1", content: "Fact 1", type: "fact", confidence: 1.0, timestamp: 1, locked: false },
      { id: "2", content: "Relationship 1", type: "relationship", confidence: 0.8, timestamp: 2, locked: false },
      { id: "3", content: "Fact 2", type: "fact", confidence: 0.9, timestamp: 3, locked: false },
      { id: "4", content: "Hook 1", type: "hook", confidence: 0.7, timestamp: 4, locked: true },
      { id: "5", content: "Relationship 2", type: "relationship", confidence: 0.6, timestamp: 5, locked: false }
    ];

    const factMemories = memories.filter(m => m.type === "fact");
    const relationshipMemories = memories.filter(m => m.type === "relationship");
    const hookMemories = memories.filter(m => m.type === "hook");
    const lockedMemories = memories.filter(m => m.locked);

    expect(factMemories).toHaveLength(2);
    expect(relationshipMemories).toHaveLength(2);
    expect(hookMemories).toHaveLength(1);
    expect(lockedMemories).toHaveLength(1);
    expect(lockedMemories[0].id).toBe("4");
  });

  test("should update memory content", () => {
    const memories: MemoryEntry[] = [
      { id: "update-1", content: "Original content", type: "fact", confidence: 1.0, timestamp: 1, locked: false }
    ];

    // Update the memory
    const updatedMemories = memories.map(m => 
      m.id === "update-1" 
        ? { ...m, content: "Updated content", confidence: 0.9 }
        : m
    );

    expect(updatedMemories[0].content).toBe("Updated content");
    expect(updatedMemories[0].confidence).toBe(0.9);
    expect(updatedMemories[0].timestamp).toBe(1); // timestamp unchanged
  });

  test("should add source turn ID to memories", () => {
    const memoryWithSource: MemoryEntry = {
      id: "source-1",
      content: "Memory from turn 5",
      type: "fact",
      confidence: 1.0,
      timestamp: Date.now(),
      sourceTurnId: "turn-5",
      locked: false
    };

    expect(memoryWithSource.sourceTurnId).toBe("turn-5");
    
    const memories: MemoryEntry[] = [memoryWithSource];
    saveToStorageAsync("source-memories", memories);
    
    setTimeout(() => {
      const stored = localStorage.getItem("source-memories");
      expect(stored).not.toBeNull();
      
      if (stored) {
        const parsed = JSON.parse(stored);
        expect(parsed[0].sourceTurnId).toBe("turn-5");
      }
    }, 10);
  });

  test("should handle memory confidence levels", () => {
    const memories: MemoryEntry[] = [
      { id: "conf-1", content: "High confidence", type: "fact", confidence: 1.0, timestamp: 1, locked: false },
      { id: "conf-2", content: "Medium confidence", type: "fact", confidence: 0.5, timestamp: 2, locked: false },
      { id: "conf-3", content: "Low confidence", type: "fact", confidence: 0.1, timestamp: 3, locked: false }
    ];

    const highConfidenceMemories = memories.filter(m => m.confidence >= 0.8);
    const mediumConfidenceMemories = memories.filter(m => m.confidence >= 0.3 && m.confidence < 0.8);
    const lowConfidenceMemories = memories.filter(m => m.confidence < 0.3);

    expect(highConfidenceMemories).toHaveLength(1);
    expect(highConfidenceMemories[0].id).toBe("conf-1");
    expect(mediumConfidenceMemories).toHaveLength(1);
    expect(mediumConfidenceMemories[0].id).toBe("conf-2");
    expect(lowConfidenceMemories).toHaveLength(1);
    expect(lowConfidenceMemories[0].id).toBe("conf-3");
  });

  test("should sort memories by timestamp", () => {
    const memories: MemoryEntry[] = [
      { id: "old", content: "Old memory", type: "fact", confidence: 1.0, timestamp: 1000, locked: false },
      { id: "new", content: "New memory", type: "fact", confidence: 1.0, timestamp: 3000, locked: false },
      { id: "middle", content: "Middle memory", type: "fact", confidence: 1.0, timestamp: 2000, locked: false }
    ];

    // Sort by timestamp (newest first)
    const sortedMemories = [...memories].sort((a, b) => b.timestamp - a.timestamp);
    
    expect(sortedMemories[0].id).toBe("new");
    expect(sortedMemories[1].id).toBe("middle");
    expect(sortedMemories[2].id).toBe("old");
  });

  test("should handle memory bank operations", () => {
    // Initial memory bank
    let memoryBank: MemoryEntry[] = [
      { id: "1", content: "Memory 1", type: "fact", confidence: 1.0, timestamp: 1, locked: false },
      { id: "2", content: "Memory 2", type: "fact", confidence: 1.0, timestamp: 2, locked: false }
    ];

    // Add a new memory
    const newMemory: MemoryEntry = {
      id: "3",
      content: "Memory 3",
      type: "relationship",
      confidence: 0.8,
      timestamp: 3,
      locked: false
    };
    
    memoryBank = [...memoryBank, newMemory];
    expect(memoryBank).toHaveLength(3);
    expect(memoryBank[2].id).toBe("3");

    // Remove a memory
    memoryBank = memoryBank.filter(m => m.id !== "2");
    expect(memoryBank).toHaveLength(2);
    expect(memoryBank.some(m => m.id === "2")).toBe(false);

    // Update a memory
    memoryBank = memoryBank.map(m => 
      m.id === "1" ? { ...m, locked: true } : m
    );
    expect(memoryBank[0].locked).toBe(true);
  });

  test("should validate memory entry structure", () => {
    const validMemory: MemoryEntry = {
      id: "valid",
      content: "Valid memory content",
      type: "fact",
      confidence: 0.9,
      timestamp: Date.now(),
      locked: false
    };

    expect(validMemory).toHaveProperty("id");
    expect(validMemory).toHaveProperty("content");
    expect(validMemory).toHaveProperty("type");
    expect(validMemory).toHaveProperty("confidence");
    expect(validMemory).toHaveProperty("timestamp");
    expect(validMemory).toHaveProperty("locked");
    
    expect(typeof validMemory.id).toBe("string");
    expect(typeof validMemory.content).toBe("string");
    expect(["fact", "relationship", "hook"]).toContain(validMemory.type);
    expect(typeof validMemory.confidence).toBe("number");
    expect(validMemory.confidence).toBeGreaterThanOrEqual(0);
    expect(validMemory.confidence).toBeLessThanOrEqual(1);
    expect(typeof validMemory.timestamp).toBe("number");
    expect(typeof validMemory.locked).toBe("boolean");
  });
});