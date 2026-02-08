/**
 * Query Parameters Utility Tests
 * 
 * Tests for query string building.
 */

import { describe, test, expect } from 'bun:test';
import {
  buildQueryString,
  parseQueryString,
  mergeQueryParams,
  cleanParams,
} from '@/lib/utils/query-params';

describe('Query Parameters Utility', () => {
  describe('buildQueryString', () => {
    test('should build query string from object', () => {
      const params = { name: 'test', value: '123' };
      const result = buildQueryString(params);
      
      expect(result).toContain('name=test');
      expect(result).toContain('value=123');
    });
    
    test('should skip undefined values', () => {
      const params = { name: 'test', value: undefined };
      const result = buildQueryString(params);
      
      expect(result).toContain('name=test');
      expect(result).not.toContain('value');
    });
    
    test('should skip null values', () => {
      const params = { name: 'test', value: null };
      const result = buildQueryString(params);
      
      expect(result).toContain('name=test');
      expect(result).not.toContain('value');
    });
    
    test('should skip empty strings', () => {
      const params = { name: 'test', value: '' };
      const result = buildQueryString(params);
      
      expect(result).toContain('name=test');
      expect(result).not.toContain('value=');
    });
    
    test('should handle arrays', () => {
      const params = { tags: ['work', 'urgent'] };
      const result = buildQueryString(params);
      
      expect(result).toContain('tags=work');
      expect(result).toContain('tags=urgent');
    });
    
    test('should skip undefined/null in arrays', () => {
      const params = { tags: ['work', null, 'urgent', undefined] };
      const result = buildQueryString(params);
      
      expect(result).toContain('tags=work');
      expect(result).toContain('tags=urgent');
      // Should only have 2 tags
      const matches = result.match(/tags=/g);
      expect(matches?.length).toBe(2);
    });
    
    test('should handle boolean values', () => {
      const params = { completed: true, archived: false };
      const result = buildQueryString(params);
      
      expect(result).toContain('completed=true');
      expect(result).toContain('archived=false');
    });
    
    test('should handle Date objects', () => {
      const date = new Date('2024-01-15T12:00:00Z');
      const params = { date };
      const result = buildQueryString(params);
      
      expect(result).toContain('date=');
      expect(result).toContain('2024-01-15');
    });
    
    test('should handle numbers', () => {
      const params = { count: 5, price: 19.99 };
      const result = buildQueryString(params);
      
      expect(result).toContain('count=5');
      expect(result).toContain('price=19.99');
    });
    
    test('should return empty string for empty object', () => {
      const result = buildQueryString({});
      expect(result).toBe('');
    });
    
    test('should URL encode special characters', () => {
      const params = { name: 'test value', email: 'test@example.com' };
      const result = buildQueryString(params);
      
      expect(result).toContain('test%20value');
      expect(result).toContain('test%40example.com');
    });
    
    test('should start with ?', () => {
      const params = { name: 'test' };
      const result = buildQueryString(params);
      
      expect(result.startsWith('?')).toBe(true);
    });
  });
  
  describe('parseQueryString', () => {
    test('should parse query string to object', () => {
      const result = parseQueryString('?name=test&value=123');
      
      expect(result.name).toBe('test');
      expect(result.value).toBe('123');
    });
    
    test('should handle query string without ?', () => {
      const result = parseQueryString('name=test');
      
      expect(result.name).toBe('test');
    });
    
    test('should handle multiple values for same key', () => {
      const result = parseQueryString('?tags=work&tags=urgent');
      
      expect(Array.isArray(result.tags)).toBe(true);
      expect((result.tags as string[]).length).toBe(2);
    });
    
    test('should return empty object for empty string', () => {
      const result = parseQueryString('');
      expect(result).toEqual({});
    });
    
    test('should decode URL encoded values', () => {
      const result = parseQueryString('?name=test%20value');
      
      expect(result.name).toBe('test value');
    });
  });
  
  describe('mergeQueryParams', () => {
    test('should merge multiple param objects', () => {
      const base = { name: 'test' };
      const extra1 = { value: '123' };
      const extra2 = { active: true };
      
      const result = mergeQueryParams(base, extra1, extra2);
      
      expect(result.name).toBe('test');
      expect(result.value).toBe('123');
      expect(result.active).toBe(true);
    });
    
    test('should override with later values', () => {
      const base = { name: 'test', value: 'old' };
      const extra = { value: 'new' };
      
      const result = mergeQueryParams(base, extra);
      
      expect(result.name).toBe('test');
      expect(result.value).toBe('new');
    });
    
    test('should not modify original objects', () => {
      const base = { name: 'test' };
      const extra = { value: '123' };
      
      mergeQueryParams(base, extra);
      
      expect(base).toEqual({ name: 'test' });
      expect(extra).toEqual({ value: '123' });
    });
    
    test('should handle empty objects', () => {
      const result = mergeQueryParams({}, {}, {});
      expect(result).toEqual({});
    });
  });
  
  describe('cleanParams', () => {
    test('should remove undefined values', () => {
      const params = { name: 'test', value: undefined };
      const result = cleanParams(params);
      
      expect(result.name).toBe('test');
      expect('value' in result).toBe(false);
    });
    
    test('should remove null values', () => {
      const params = { name: 'test', value: null };
      const result = cleanParams(params);
      
      expect(result.name).toBe('test');
      expect('value' in result).toBe(false);
    });
    
    test('should keep falsy values that are not null/undefined', () => {
      const params = {
        name: 'test',
        count: 0,
        active: false,
        empty: '',
      };
      const result = cleanParams(params);
      
      expect(result.count).toBe(0);
      expect(result.active).toBe(false);
      expect(result.empty).toBe('');
    });
    
    test('should not modify original object', () => {
      const params = { name: 'test', value: undefined };
      cleanParams(params);
      
      expect(params).toEqual({ name: 'test', value: undefined });
    });
    
    test('should return empty object for all null/undefined', () => {
      const params = { a: null, b: undefined };
      const result = cleanParams(params);
      
      expect(result).toEqual({});
    });
  });
});
