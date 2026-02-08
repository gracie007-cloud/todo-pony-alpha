/**
 * Date Utilities Tests
 * 
 * Tests for date formatting, parsing, and ranges.
 */

import { describe, test, expect, beforeEach } from 'bun:test';
import {
  formatDate,
  formatDateTime,
  formatTime,
  getRelativeDateLabel,
  getRelativeTime,
  isOverdue,
  isDueToday,
  isWithinDays,
  isThisWeek,
  getTodayRange,
  getWeekRange,
  getNextDaysRange,
  getDateGroup,
  getDateGroupLabel,
  toIsoString,
  parseDate,
  getDaysUntil,
} from '@/lib/utils/date-utils';
import { testDates } from '../utils/fixtures';

describe('Date Utilities', () => {
  describe('formatDate', () => {
    test('should format date with default format', () => {
      const date = new Date('2024-01-15T12:00:00Z');
      const result = formatDate(date);
      
      // Result depends on locale, but should contain month and year
      expect(result).toContain('2024');
    });
    
    test('should format date with custom format', () => {
      const date = new Date('2024-01-15T12:00:00Z');
      const result = formatDate(date, 'yyyy-MM-dd');
      
      expect(result).toBe('2024-01-15');
    });
    
    test('should handle string date input', () => {
      const result = formatDate('2024-01-15T12:00:00Z', 'yyyy-MM-dd');
      expect(result).toBe('2024-01-15');
    });
    
    test('should return empty string for null date', () => {
      expect(formatDate(null)).toBe('');
    });
    
    test('should return empty string for invalid date', () => {
      expect(formatDate('invalid')).toBe('');
    });
  });
  
  describe('formatDateTime', () => {
    test('should format date with time', () => {
      const date = new Date('2024-01-15T14:30:00Z');
      const result = formatDateTime(date);
      
      expect(result).toContain('2024');
    });
    
    test('should return empty string for null', () => {
      expect(formatDateTime(null)).toBe('');
    });
  });
  
  describe('formatTime', () => {
    test('should format time only', () => {
      const date = new Date('2024-01-15T14:30:00Z');
      const result = formatTime(date);
      
      // Should contain time components
      expect(result).toMatch(/\d{1,2}:\d{2}/);
    });
    
    test('should return empty string for null', () => {
      expect(formatTime(null)).toBe('');
    });
  });
  
  describe('getRelativeDateLabel', () => {
    test('should return "Today" for today', () => {
      const today = new Date();
      expect(getRelativeDateLabel(today)).toBe('Today');
    });
    
    test('should return "Tomorrow" for tomorrow', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(getRelativeDateLabel(tomorrow)).toBe('Tomorrow');
    });
    
    test('should return "Yesterday" for yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(getRelativeDateLabel(yesterday)).toBe('Yesterday');
    });
    
    test('should return formatted date for other dates', () => {
      const date = new Date('2024-06-15T12:00:00Z');
      const result = getRelativeDateLabel(date);
      
      // Should not be Today/Tomorrow/Yesterday
      expect(result).not.toBe('Today');
      expect(result).not.toBe('Tomorrow');
      expect(result).not.toBe('Yesterday');
    });
    
    test('should handle string input', () => {
      const today = new Date().toISOString();
      expect(getRelativeDateLabel(today)).toBe('Today');
    });
    
    test('should return empty string for invalid date', () => {
      expect(getRelativeDateLabel('invalid')).toBe('');
    });
  });
  
  describe('getRelativeTime', () => {
    test('should return relative time string', () => {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const result = getRelativeTime(oneHourAgo);
      
      expect(result).toContain('ago');
    });
    
    test('should return relative time for future', () => {
      const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000);
      const result = getRelativeTime(oneHourFromNow);
      
      expect(result).toContain('in');
    });
  });
  
  describe('isOverdue', () => {
    test('should return false for null date', () => {
      expect(isOverdue(null)).toBe(false);
    });
    
    test('should return false for today', () => {
      expect(isOverdue(new Date())).toBe(false);
    });
    
    test('should return true for past date', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(isOverdue(yesterday)).toBe(true);
    });
    
    test('should return false for future date', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(isOverdue(tomorrow)).toBe(false);
    });
    
    test('should handle string input', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(isOverdue(yesterday.toISOString())).toBe(true);
    });
  });
  
  describe('isDueToday', () => {
    test('should return true for today', () => {
      expect(isDueToday(new Date())).toBe(true);
    });
    
    test('should return false for tomorrow', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(isDueToday(tomorrow)).toBe(false);
    });
    
    test('should return false for null', () => {
      expect(isDueToday(null)).toBe(false);
    });
  });
  
  describe('isWithinDays', () => {
    test('should return true for date within range', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(isWithinDays(tomorrow, 3)).toBe(true);
    });
    
    test('should return false for date outside range', () => {
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 10);
      expect(isWithinDays(nextWeek, 3)).toBe(false);
    });
    
    test('should return true for today', () => {
      expect(isWithinDays(new Date(), 3)).toBe(true);
    });
    
    test('should return false for null', () => {
      expect(isWithinDays(null, 3)).toBe(false);
    });
  });
  
  describe('isThisWeek', () => {
    test('should return true for date this week', () => {
      expect(isThisWeek(new Date())).toBe(true);
    });
    
    test('should return false for date next week', () => {
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 8);
      expect(isThisWeek(nextWeek)).toBe(false);
    });
    
    test('should return false for null', () => {
      expect(isThisWeek(null)).toBe(false);
    });
  });
  
  describe('getTodayRange', () => {
    test('should return start and end of today', () => {
      const range = getTodayRange();
      
      expect(range.start).toBeInstanceOf(Date);
      expect(range.end).toBeInstanceOf(Date);
      expect(range.start <= range.end).toBe(true);
    });
  });
  
  describe('getWeekRange', () => {
    test('should return start and end of current week', () => {
      const range = getWeekRange();
      
      expect(range.start).toBeInstanceOf(Date);
      expect(range.end).toBeInstanceOf(Date);
      expect(range.start <= range.end).toBe(true);
    });
  });
  
  describe('getNextDaysRange', () => {
    test('should return range for next N days', () => {
      const range = getNextDaysRange(7);
      
      expect(range.start).toBeInstanceOf(Date);
      expect(range.end).toBeInstanceOf(Date);
      expect(range.start <= range.end).toBe(true);
    });
  });
  
  describe('getDateGroup', () => {
    test('should return "today" for today', () => {
      expect(getDateGroup(new Date())).toBe('today');
    });
    
    test('should return "tomorrow" for tomorrow', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(getDateGroup(tomorrow)).toBe('tomorrow');
    });
    
    test('should return "overdue" for past date', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(getDateGroup(yesterday)).toBe('overdue');
    });
    
    test('should return "thisWeek" for date in same week', () => {
      const inTwoDays = new Date();
      inTwoDays.setDate(inTwoDays.getDate() + 2);
      // This might be 'thisWeek' or 'later' depending on current day
      const result = getDateGroup(inTwoDays);
      expect(['thisWeek', 'later', 'tomorrow']).toContain(result);
    });
    
    test('should return "noDate" for null', () => {
      expect(getDateGroup(null)).toBe('noDate');
    });
  });
  
  describe('getDateGroupLabel', () => {
    test('should return label for each group', () => {
      expect(getDateGroupLabel('overdue')).toBe('Overdue');
      expect(getDateGroupLabel('today')).toBe('Today');
      expect(getDateGroupLabel('tomorrow')).toBe('Tomorrow');
      expect(getDateGroupLabel('thisWeek')).toBe('This Week');
      expect(getDateGroupLabel('later')).toBe('Later');
      expect(getDateGroupLabel('noDate')).toBe('No Date');
    });
  });
  
  describe('toIsoString', () => {
    test('should convert date to ISO string', () => {
      const date = new Date('2024-01-15T12:00:00Z');
      const result = toIsoString(date);
      
      expect(result).toBe('2024-01-15T12:00:00.000Z');
    });
    
    test('should return null for null input', () => {
      expect(toIsoString(null)).toBeNull();
    });
  });
  
  describe('parseDate', () => {
    test('should parse ISO string', () => {
      const result = parseDate('2024-01-15T12:00:00Z');
      
      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(2024);
    });
    
    test('should return Date object as-is', () => {
      const date = new Date();
      const result = parseDate(date);
      
      expect(result).toBe(date);
    });
    
    test('should return null for null input', () => {
      expect(parseDate(null)).toBeNull();
    });
    
    test('should return null for invalid string', () => {
      expect(parseDate('invalid')).toBeNull();
    });
  });
  
  describe('getDaysUntil', () => {
    test('should return 0 for today', () => {
      expect(getDaysUntil(new Date())).toBe(0);
    });
    
    test('should return positive for future date', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(getDaysUntil(tomorrow)).toBe(1);
    });
    
    test('should return negative for past date', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(getDaysUntil(yesterday)).toBe(-1);
    });
    
    test('should return null for null input', () => {
      expect(getDaysUntil(null)).toBeNull();
    });
    
    test('should handle string input', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(getDaysUntil(tomorrow.toISOString())).toBe(1);
    });
  });
});
