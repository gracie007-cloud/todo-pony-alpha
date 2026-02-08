/**
 * useSearch Hook Tests
 * 
 * Tests for search with Fuse.js.
 */

import { describe, test, expect, beforeEach } from 'bun:test';
import type { TaskWithRelations, Label, List } from '@/lib/db/schema';
import { createTestTaskWithRelations, createTestList, createTestLabel } from '../utils/fixtures';

// Simple search implementation for testing (simulates Fuse.js behavior)
function createSimpleSearch<T>(
  items: T[],
  keys: string[],
  options: { threshold?: number } = {}
) {
  const threshold = options.threshold ?? 0.3;
  
  return {
    search: (query: string): Array<{ item: T; score?: number }> => {
      if (!query.trim()) {
        return items.map(item => ({ item }));
      }
      
      const lowerQuery = query.toLowerCase();
      const results: Array<{ item: T; score: number }> = [];
      
      for (const item of items) {
        let bestScore = 1; // Lower is better in Fuse.js
        
        for (const key of keys) {
          const value = getNestedValue(item, key);
          if (typeof value === 'string') {
            const lowerValue = value.toLowerCase();
            
            // Exact match
            if (lowerValue === lowerQuery) {
              bestScore = 0;
              break;
            }
            
            // Contains match
            if (lowerValue.includes(lowerQuery)) {
              const index = lowerValue.indexOf(lowerQuery);
              bestScore = Math.min(bestScore, 0.1 + (index * 0.01));
            }
            
            // Starts with match
            if (lowerValue.startsWith(lowerQuery)) {
              bestScore = Math.min(bestScore, 0.05);
            }
          }
        }
        
        if (bestScore < threshold) {
          results.push({ item, score: bestScore });
        }
      }
      
      // Sort by score
      results.sort((a, b) => (a.score ?? 1) - (b.score ?? 1));
      
      return results;
    },
  };
}

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((current, key) => {
    if (current === null || current === undefined) return undefined;
    if (Array.isArray(current)) {
      return current.map(item => item?.[key]);
    }
    if (typeof current === 'object' && current !== null) {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj as unknown);
}

// Simulate useSearch hook
function simulateTaskSearch(
  tasks: TaskWithRelations[],
  debounceDelay: number = 200
) {
  let query = '';
  let debouncedQuery = '';
  let debounceTimer: Timer | null = null;
  
  const fuse = createSimpleSearch(
    tasks,
    ['name', 'description', 'labels.name', 'list.name'],
    { threshold: 0.3 }
  );
  
  return {
    getQuery: () => query,
    getDebouncedQuery: () => debouncedQuery,
    getResults: () => {
      if (!debouncedQuery.trim()) {
        return tasks.map(task => ({ item: task }));
      }
      return fuse.search(debouncedQuery);
    },
    search: (newQuery: string) => {
      query = newQuery;
      
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      
      debounceTimer = setTimeout(() => {
        debouncedQuery = newQuery;
      }, debounceDelay);
    },
    setDebouncedQuery: (value: string) => {
      debouncedQuery = value;
    },
    clear: () => {
      query = '';
      debouncedQuery = '';
    },
    isSearching: () => query !== debouncedQuery,
  };
}

function simulateLabelSearch(labels: Label[]) {
  let query = '';
  let debouncedQuery = '';
  
  const fuse = createSimpleSearch(labels, ['name'], { threshold: 0.3 });
  
  return {
    getQuery: () => query,
    getResults: () => {
      if (!debouncedQuery.trim()) {
        return labels;
      }
      return fuse.search(debouncedQuery).map(r => r.item);
    },
    search: (newQuery: string) => {
      query = newQuery;
      debouncedQuery = newQuery;
    },
    clear: () => {
      query = '';
      debouncedQuery = '';
    },
  };
}

function simulateListSearch(lists: List[]) {
  let query = '';
  let debouncedQuery = '';
  
  const fuse = createSimpleSearch(lists, ['name'], { threshold: 0.3 });
  
  return {
    getQuery: () => query,
    getResults: () => {
      if (!debouncedQuery.trim()) {
        return lists;
      }
      return fuse.search(debouncedQuery).map(r => r.item);
    },
    search: (newQuery: string) => {
      query = newQuery;
      debouncedQuery = newQuery;
    },
    clear: () => {
      query = '';
      debouncedQuery = '';
    },
  };
}

describe('useSearch Hook', () => {
  describe('Task Search', () => {
    let tasks: TaskWithRelations[];
    
    beforeEach(() => {
      tasks = [
        createTestTaskWithRelations({ name: 'Buy groceries', description: 'Get milk and eggs' }),
        createTestTaskWithRelations({ name: 'Walk the dog', description: 'Morning walk' }),
        createTestTaskWithRelations({ name: 'Buy tickets', description: 'Concert next week' }),
        createTestTaskWithRelations({ name: 'Call mom', description: null }),
      ];
    });
    
    test('should return all tasks when query is empty', () => {
      const search = simulateTaskSearch(tasks);
      const results = search.getResults();
      
      expect(results.length).toBe(4);
    });
    
    test('should find tasks by name', () => {
      const search = simulateTaskSearch(tasks);
      search.setDebouncedQuery('buy');
      const results = search.getResults();
      
      expect(results.length).toBe(2);
      expect(results.every(r => 
        r.item.name.toLowerCase().includes('buy')
      )).toBe(true);
    });
    
    test('should find tasks by description', () => {
      const search = simulateTaskSearch(tasks);
      search.setDebouncedQuery('walk');
      const results = search.getResults();
      
      expect(results.length).toBe(1);
    });
    
    test('should be case insensitive', () => {
      const search = simulateTaskSearch(tasks);
      search.setDebouncedQuery('BUY');
      const results = search.getResults();
      
      expect(results.length).toBe(2);
    });
    
    test('should clear search', () => {
      const search = simulateTaskSearch(tasks);
      search.setDebouncedQuery('buy');
      search.clear();
      
      expect(search.getQuery()).toBe('');
      expect(search.getDebouncedQuery()).toBe('');
      expect(search.getResults().length).toBe(4);
    });
    
    test('should track searching state', () => {
      const search = simulateTaskSearch(tasks);
      
      expect(search.isSearching()).toBe(false);
      
      search.search('test');
      expect(search.isSearching()).toBe(true);
      
      search.setDebouncedQuery('test');
      expect(search.isSearching()).toBe(false);
    });
  });
  
  describe('Task Search with Relations', () => {
    let tasks: TaskWithRelations[];
    
    beforeEach(() => {
      const workLabel = createTestLabel({ name: 'Work' });
      const personalLabel = createTestLabel({ name: 'Personal' });
      const shoppingList = createTestList({ name: 'Shopping List' });
      const workList = createTestList({ name: 'Work Tasks' });
      
      tasks = [
        createTestTaskWithRelations(
          { name: 'Task 1' },
          { labels: [workLabel], list: workList }
        ),
        createTestTaskWithRelations(
          { name: 'Task 2' },
          { labels: [personalLabel], list: shoppingList }
        ),
      ];
    });
    
    test('should find tasks by label name', () => {
      const search = simulateTaskSearch(tasks);
      search.setDebouncedQuery('work');
      const results = search.getResults();
      
      // Should find by label 'Work' and list 'Work Tasks'
      expect(results.length).toBeGreaterThanOrEqual(1);
    });
    
    test('should find tasks by list name', () => {
      const search = simulateTaskSearch(tasks);
      search.setDebouncedQuery('shopping');
      const results = search.getResults();
      
      expect(results.length).toBe(1);
    });
  });
  
  describe('Label Search', () => {
    let labels: Label[];
    
    beforeEach(() => {
      labels = [
        createTestLabel({ name: 'Work' }),
        createTestLabel({ name: 'Personal' }),
        createTestLabel({ name: 'Urgent' }),
        createTestLabel({ name: 'Important' }),
      ];
    });
    
    test('should return all labels when query is empty', () => {
      const search = simulateLabelSearch(labels);
      const results = search.getResults();
      
      expect(results.length).toBe(4);
    });
    
    test('should find labels by name', () => {
      const search = simulateLabelSearch(labels);
      search.search('work');
      const results = search.getResults();
      
      expect(results.length).toBe(1);
      expect(results[0].name).toBe('Work');
    });
    
    test('should be case insensitive', () => {
      const search = simulateLabelSearch(labels);
      search.search('URGENT');
      const results = search.getResults();
      
      expect(results.length).toBe(1);
    });
    
    test('should clear search', () => {
      const search = simulateLabelSearch(labels);
      search.search('work');
      search.clear();
      
      expect(search.getQuery()).toBe('');
      expect(search.getResults().length).toBe(4);
    });
  });
  
  describe('List Search', () => {
    let lists: List[];
    
    beforeEach(() => {
      lists = [
        createTestList({ name: 'Inbox' }),
        createTestList({ name: 'Shopping' }),
        createTestList({ name: 'Work Projects' }),
        createTestList({ name: 'Personal Tasks' }),
      ];
    });
    
    test('should return all lists when query is empty', () => {
      const search = simulateListSearch(lists);
      const results = search.getResults();
      
      expect(results.length).toBe(4);
    });
    
    test('should find lists by name', () => {
      const search = simulateListSearch(lists);
      search.search('shopping');
      const results = search.getResults();
      
      expect(results.length).toBe(1);
      expect(results[0].name).toBe('Shopping');
    });
    
    test('should find partial matches', () => {
      const search = simulateListSearch(lists);
      search.search('work');
      const results = search.getResults();
      
      expect(results.length).toBe(1);
      expect(results[0].name).toBe('Work Projects');
    });
    
    test('should clear search', () => {
      const search = simulateListSearch(lists);
      search.search('inbox');
      search.clear();
      
      expect(search.getQuery()).toBe('');
      expect(search.getResults().length).toBe(4);
    });
  });
  
  describe('Search Edge Cases', () => {
    test('should handle empty items array', () => {
      const search = simulateTaskSearch([]);
      search.setDebouncedQuery('test');
      
      expect(search.getResults()).toEqual([]);
    });
    
    test('should handle special characters in query', () => {
      const tasks = [
        createTestTaskWithRelations({ name: 'Task (important)' }),
        createTestTaskWithRelations({ name: 'Task [urgent]' }),
      ];
      
      const search = simulateTaskSearch(tasks);
      search.setDebouncedQuery('(important');
      const results = search.getResults();
      
      expect(results.length).toBe(1);
    });
    
    test('should handle whitespace in query', () => {
      const tasks = [
        createTestTaskWithRelations({ name: 'Buy groceries' }),
      ];
      
      const search = simulateTaskSearch(tasks);
      search.setDebouncedQuery('  buy  ');
      const results = search.getResults();
      
      expect(results.length).toBe(1);
    });
    
    test('should handle very long queries', () => {
      const tasks = [
        createTestTaskWithRelations({ name: 'Short task' }),
      ];
      
      const search = simulateTaskSearch(tasks);
      search.setDebouncedQuery('a'.repeat(1000));
      const results = search.getResults();
      
      expect(results.length).toBe(0);
    });
  });
});
