/**
 * useLocalStorage Hook Tests
 * 
 * Tests for storage persistence.
 */

import { describe, test, expect, beforeEach } from 'bun:test';

// Simulate localStorage for testing
function createMockLocalStorage() {
  const store: Record<string, string> = {};
  
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      Object.keys(store).forEach(key => delete store[key]);
    },
    get store() {
      return { ...store };
    },
  };
}

// Simulate useLocalStorage hook logic
function simulateLocalStorage<T>(
  mockStorage: ReturnType<typeof createMockLocalStorage>,
  key: string,
  initialValue: T
): {
  getValue: () => T;
  setValue: (value: T | ((prev: T) => T)) => void;
  removeValue: () => void;
} {
  let storedValue: T;
  
  // Get initial value from storage or use provided initial value
  try {
    const item = mockStorage.getItem(key);
    storedValue = item ? JSON.parse(item) : initialValue;
  } catch {
    storedValue = initialValue;
  }
  
  return {
    getValue: () => storedValue,
    setValue: (value) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        storedValue = valueToStore;
        mockStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    },
    removeValue: () => {
      try {
        storedValue = initialValue;
        mockStorage.removeItem(key);
      } catch (error) {
        console.warn(`Error removing localStorage key "${key}":`, error);
      }
    },
  };
}

describe('useLocalStorage Hook', () => {
  let mockStorage: ReturnType<typeof createMockLocalStorage>;
  
  beforeEach(() => {
    mockStorage = createMockLocalStorage();
  });
  
  describe('initial value', () => {
    test('should return initial value when storage is empty', () => {
      const storage = simulateLocalStorage(mockStorage, 'test-key', 'initial');
      expect(storage.getValue()).toBe('initial');
    });
    
    test('should return stored value when exists', () => {
      mockStorage.setItem('test-key', JSON.stringify('stored'));
      const storage = simulateLocalStorage(mockStorage, 'test-key', 'initial');
      expect(storage.getValue()).toBe('stored');
    });
    
    test('should handle object initial values', () => {
      const initial = { name: 'test', count: 0 };
      const storage = simulateLocalStorage(mockStorage, 'test-key', initial);
      expect(storage.getValue()).toEqual(initial);
    });
    
    test('should handle array initial values', () => {
      const initial = [1, 2, 3];
      const storage = simulateLocalStorage(mockStorage, 'test-key', initial);
      expect(storage.getValue()).toEqual(initial);
    });
    
    test('should handle null initial value', () => {
      const storage = simulateLocalStorage<string | null>(mockStorage, 'test-key', null);
      expect(storage.getValue()).toBeNull();
    });
  });
  
  describe('setValue', () => {
    test('should update value in memory and storage', () => {
      const storage = simulateLocalStorage(mockStorage, 'test-key', 'initial');
      storage.setValue('updated');
      
      expect(storage.getValue()).toBe('updated');
      expect(JSON.parse(mockStorage.getItem('test-key')!)).toBe('updated');
    });
    
    test('should handle function updates', () => {
      const storage = simulateLocalStorage(mockStorage, 'test-key', 0);
      storage.setValue(prev => prev + 1);
      storage.setValue(prev => prev + 1);
      storage.setValue(prev => prev + 1);
      
      expect(storage.getValue()).toBe(3);
    });
    
    test('should store objects as JSON', () => {
      const storage = simulateLocalStorage(mockStorage, 'test-key', { count: 0 });
      storage.setValue({ count: 5, name: 'test' });
      
      const stored = JSON.parse(mockStorage.getItem('test-key')!);
      expect(stored).toEqual({ count: 5, name: 'test' });
    });
    
    test('should store arrays as JSON', () => {
      const storage = simulateLocalStorage<number[]>(mockStorage, 'test-key', []);
      storage.setValue([1, 2, 3]);
      
      const stored = JSON.parse(mockStorage.getItem('test-key')!);
      expect(stored).toEqual([1, 2, 3]);
    });
    
    test('should handle boolean values', () => {
      const storage = simulateLocalStorage(mockStorage, 'test-key', false);
      storage.setValue(true);
      
      expect(storage.getValue()).toBe(true);
      expect(JSON.parse(mockStorage.getItem('test-key')!)).toBe(true);
    });
    
    test('should handle null values', () => {
      const storage = simulateLocalStorage<string | null>(mockStorage, 'test-key', 'initial');
      storage.setValue(null);
      
      expect(storage.getValue()).toBeNull();
    });
  });
  
  describe('removeValue', () => {
    test('should remove value from storage', () => {
      const storage = simulateLocalStorage(mockStorage, 'test-key', 'initial');
      storage.setValue('stored');
      storage.removeValue();
      
      expect(mockStorage.getItem('test-key')).toBeNull();
    });
    
    test('should reset to initial value', () => {
      const storage = simulateLocalStorage(mockStorage, 'test-key', 'initial');
      storage.setValue('stored');
      storage.removeValue();
      
      expect(storage.getValue()).toBe('initial');
    });
  });
  
  describe('multiple keys', () => {
    test('should handle multiple independent keys', () => {
      const storage1 = simulateLocalStorage(mockStorage, 'key1', 'value1');
      const storage2 = simulateLocalStorage(mockStorage, 'key2', 'value2');
      
      storage1.setValue('updated1');
      storage2.setValue('updated2');
      
      expect(storage1.getValue()).toBe('updated1');
      expect(storage2.getValue()).toBe('updated2');
    });
    
    test('should not interfere with other keys', () => {
      const storage1 = simulateLocalStorage(mockStorage, 'key1', 'value1');
      const storage2 = simulateLocalStorage(mockStorage, 'key2', 'value2');
      
      storage1.removeValue();
      
      expect(storage2.getValue()).toBe('value2');
    });
  });
  
  describe('error handling', () => {
    test('should handle JSON parse errors gracefully', () => {
      mockStorage.setItem('test-key', 'invalid-json{');
      const storage = simulateLocalStorage(mockStorage, 'test-key', 'fallback');
      
      expect(storage.getValue()).toBe('fallback');
    });
    
    test('should handle complex nested objects', () => {
      const complex = {
        user: {
          name: 'John',
          preferences: {
            theme: 'dark',
            notifications: true,
          },
        },
        items: [1, 2, 3],
      };
      
      const storage = simulateLocalStorage(mockStorage, 'test-key', complex);
      expect(storage.getValue()).toEqual(complex);
    });
  });
  
  describe('type safety', () => {
    test('should maintain number type', () => {
      const storage = simulateLocalStorage(mockStorage, 'test-key', 42);
      storage.setValue(100);
      
      expect(typeof storage.getValue()).toBe('number');
    });
    
    test('should maintain object type', () => {
      interface User {
        name: string;
        age: number;
      }
      
      const storage = simulateLocalStorage<User>(mockStorage, 'test-key', { name: 'John', age: 30 });
      storage.setValue({ name: 'Jane', age: 25 });
      
      const value = storage.getValue();
      expect(value.name).toBe('Jane');
      expect(value.age).toBe(25);
    });
  });
  
  describe('edge cases', () => {
    test('should handle empty string', () => {
      const storage = simulateLocalStorage(mockStorage, 'test-key', 'initial');
      storage.setValue('');
      
      expect(storage.getValue()).toBe('');
    });
    
    test('should handle empty object', () => {
      const storage = simulateLocalStorage(mockStorage, 'test-key', { initial: true });
      storage.setValue({});
      
      expect(storage.getValue()).toEqual({});
    });
    
    test('should handle empty array', () => {
      const storage = simulateLocalStorage<number[]>(mockStorage, 'test-key', [1, 2, 3]);
      storage.setValue([]);
      
      expect(storage.getValue()).toEqual([]);
    });
    
    test('should handle special characters in key', () => {
      const storage = simulateLocalStorage(mockStorage, 'test-key-with-special.chars_123', 'value');
      storage.setValue('updated');
      
      expect(storage.getValue()).toBe('updated');
    });
  });
});
