import { describe, it, expect } from 'bun:test';
import { MemoryEntry } from '../types';

describe('memoryUtils logic tests', () => {
  it('Should handle merging generated memories with locked ones', () => {
      const lockedMemories: MemoryEntry[] = [
          { id: '1', content: 'Locked memory 1', type: 'fact', confidence: 1, timestamp: 100, locked: true },
      ];

      const newAdditions = ['New generated memory'];

      const generatedMemories = new Map<string, MemoryEntry>();
      newAdditions.forEach(mem => {
          const existsInLocked = lockedMemories.some(m => m.content === mem);
          if (!existsInLocked && !generatedMemories.has(mem)) {
              generatedMemories.set(mem, {
                  id: 'test-id', content: mem, type: 'fact', confidence: 1, timestamp: 200, locked: false
              });
          }
      });

      const finalMemories = [...lockedMemories, ...Array.from(generatedMemories.values())];
      expect(finalMemories.length).toBe(2);
      expect(finalMemories[0].content).toBe('Locked memory 1');
      expect(finalMemories[1].content).toBe('New generated memory');
  });

  it('Should not add duplicate generated memories if they already exist in locked memories', () => {
    const lockedMemories: MemoryEntry[] = [
        { id: '1', content: 'A very important fact', type: 'fact', confidence: 1, timestamp: 100, locked: true },
    ];

    const newAdditions = ['A very important fact', 'Another fact'];

    const generatedMemories = new Map<string, MemoryEntry>();
    newAdditions.forEach(mem => {
        const existsInLocked = lockedMemories.some(m => m.content === mem);
        if (!existsInLocked && !generatedMemories.has(mem)) {
            generatedMemories.set(mem, {
                id: 'test-id', content: mem, type: 'fact', confidence: 1, timestamp: 200, locked: false
            });
        }
    });

    const finalMemories = [...lockedMemories, ...Array.from(generatedMemories.values())];
    expect(finalMemories.length).toBe(2);
    expect(finalMemories[0].content).toBe('A very important fact');
    expect(finalMemories[1].content).toBe('Another fact');
  });
});
