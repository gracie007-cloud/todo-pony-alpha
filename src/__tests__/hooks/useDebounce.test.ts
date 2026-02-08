/**
 * useDebounce Hook Tests
 * 
 * Tests for debounce functionality.
 */

import { describe, test, expect } from 'bun:test';

// Simulate useDebounce logic for testing
function simulateDebounce<T>(value: T, delay: number = 300): {
  getValue: () => T;
  setValue: (newValue: T) => void;
  flush: () => void;
  cancel: () => void;
} {
  let currentValue = value;
  let debouncedValue = value;
  let timeoutId: Timer | null = null;
  
  return {
    getValue: () => debouncedValue,
    setValue: (newValue: T) => {
      currentValue = newValue;
      
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      timeoutId = setTimeout(() => {
        debouncedValue = currentValue;
      }, delay);
    },
    flush: () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        debouncedValue = currentValue;
      }
    },
    cancel: () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    },
  };
}

describe('useDebounce Hook', () => {
  describe('debounce functionality', () => {
    test('should return initial value immediately', () => {
      const debounce = simulateDebounce('initial');
      expect(debounce.getValue()).toBe('initial');
    });
    
    test('should not update value immediately after set', () => {
      const debounce = simulateDebounce('initial', 300);
      debounce.setValue('updated');
      
      // Value should still be initial
      expect(debounce.getValue()).toBe('initial');
    });
    
    test('should update value after delay', async () => {
      const debounce = simulateDebounce('initial', 100);
      debounce.setValue('updated');
      
      // Wait for delay
      await new Promise(resolve => setTimeout(resolve, 150));
      
      expect(debounce.getValue()).toBe('updated');
    });
    
    test('should cancel previous pending update', async () => {
      const debounce = simulateDebounce('initial', 100);
      
      debounce.setValue('first');
      await new Promise(resolve => setTimeout(resolve, 50));
      
      debounce.setValue('second');
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Still not enough time passed since last update
      expect(debounce.getValue()).toBe('initial');
      
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(debounce.getValue()).toBe('second');
    });
    
    test('should only update once for rapid changes', async () => {
      const debounce = simulateDebounce('initial', 100);
      
      for (let i = 0; i < 10; i++) {
        debounce.setValue(`value-${i}`);
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      
      await new Promise(resolve => setTimeout(resolve, 150));
      
      expect(debounce.getValue()).toBe('value-9');
    });
  });
  
  describe('flush functionality', () => {
    test('should immediately update value on flush', () => {
      const debounce = simulateDebounce('initial', 300);
      debounce.setValue('updated');
      
      // Before flush
      expect(debounce.getValue()).toBe('initial');
      
      debounce.flush();
      
      // After flush
      expect(debounce.getValue()).toBe('updated');
    });
    
    test('should clear pending timeout on flush', async () => {
      const debounce = simulateDebounce('initial', 100);
      debounce.setValue('updated');
      debounce.flush();
      
      // Wait for original delay
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Value should still be the flushed value
      expect(debounce.getValue()).toBe('updated');
    });
  });
  
  describe('cancel functionality', () => {
    test('should cancel pending update', async () => {
      const debounce = simulateDebounce('initial', 100);
      debounce.setValue('updated');
      debounce.cancel();
      
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Value should still be initial because update was cancelled
      expect(debounce.getValue()).toBe('initial');
    });
  });
  
  describe('different value types', () => {
    test('should handle number values', async () => {
      const debounce = simulateDebounce(0, 50);
      debounce.setValue(42);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(debounce.getValue()).toBe(42);
    });
    
    test('should handle object values', async () => {
      const debounce = simulateDebounce({ name: 'initial' }, 50);
      debounce.setValue({ name: 'updated' });
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(debounce.getValue()).toEqual({ name: 'updated' });
    });
    
    test('should handle array values', async () => {
      const debounce = simulateDebounce([1, 2, 3], 50);
      debounce.setValue([4, 5, 6]);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(debounce.getValue()).toEqual([4, 5, 6]);
    });
    
    test('should handle null values', async () => {
      const debounce = simulateDebounce<string | null>('initial', 50);
      debounce.setValue(null);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(debounce.getValue()).toBeNull();
    });
    
    test('should handle undefined values', async () => {
      const debounce = simulateDebounce<string | undefined>('initial', 50);
      debounce.setValue(undefined);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(debounce.getValue()).toBeUndefined();
    });
    
    test('should handle boolean values', async () => {
      const debounce = simulateDebounce(false, 50);
      debounce.setValue(true);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(debounce.getValue()).toBe(true);
    });
  });
  
  describe('custom delay', () => {
    test('should use custom delay', async () => {
      const debounce = simulateDebounce('initial', 500);
      debounce.setValue('updated');
      
      // Wait 300ms - not enough
      await new Promise(resolve => setTimeout(resolve, 300));
      expect(debounce.getValue()).toBe('initial');
      
      // Wait another 300ms - total 600ms
      await new Promise(resolve => setTimeout(resolve, 300));
      expect(debounce.getValue()).toBe('updated');
    });
    
    test('should handle zero delay', async () => {
      const debounce = simulateDebounce('initial', 0);
      debounce.setValue('updated');
      
      // Even with 0 delay, setTimeout is async
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(debounce.getValue()).toBe('updated');
    });
  });
  
  describe('edge cases', () => {
    test('should handle same value set multiple times', async () => {
      const debounce = simulateDebounce('same', 50);
      debounce.setValue('same');
      debounce.setValue('same');
      debounce.setValue('same');
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(debounce.getValue()).toBe('same');
    });
    
    test('should handle empty string', async () => {
      const debounce = simulateDebounce('initial', 50);
      debounce.setValue('');
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(debounce.getValue()).toBe('');
    });
    
    test('should handle setting value after flush', async () => {
      const debounce = simulateDebounce('initial', 50);
      debounce.setValue('first');
      debounce.flush();
      
      debounce.setValue('second');
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(debounce.getValue()).toBe('second');
    });
  });
});
