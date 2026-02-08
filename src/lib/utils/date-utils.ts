/**
 * Date Utilities
 * 
 * Date formatting and manipulation helpers using date-fns.
 */

import {
  format,
  formatDistanceToNow,
  isToday,
  isTomorrow,
  isYesterday,
  isPast,
  isFuture,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addDays,
  addWeeks,
  addMonths,
  subDays,
  differenceInDays,
  differenceInMinutes,
  differenceInHours,
  parseISO,
  isValid,
} from 'date-fns';

// Re-export commonly used date-fns functions
export {
  format,
  formatDistanceToNow,
  isToday,
  isTomorrow,
  isYesterday,
  isPast,
  isFuture,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addDays,
  addWeeks,
  addMonths,
  subDays,
  differenceInDays,
  differenceInMinutes,
  differenceInHours,
  parseISO,
  isValid,
};

/**
 * Format a date for display
 */
export function formatDate(date: Date | string | null, formatStr: string = 'MMM d, yyyy'): string {
  if (!date) return '';
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return '';
  return format(d, formatStr);
}

/**
 * Format a date with time
 */
export function formatDateTime(date: Date | string | null): string {
  if (!date) return '';
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return '';
  return format(d, 'MMM d, yyyy h:mm a');
}

/**
 * Format time only
 */
export function formatTime(date: Date | string | null): string {
  if (!date) return '';
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return '';
  return format(d, 'h:mm a');
}

/**
 * Get relative date label (Today, Tomorrow, Yesterday, or formatted date)
 */
export function getRelativeDateLabel(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return '';
  
  if (isToday(d)) return 'Today';
  if (isTomorrow(d)) return 'Tomorrow';
  if (isYesterday(d)) return 'Yesterday';
  
  return format(d, 'EEE, MMM d');
}

/**
 * Get a human-readable relative time (e.g., "2 hours ago", "in 3 days")
 */
export function getRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return '';
  return formatDistanceToNow(d, { addSuffix: true });
}

/**
 * Check if a date is overdue
 */
export function isOverdue(date: Date | string | null): boolean {
  if (!date) return false;
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return false;
  return isPast(d) && !isToday(d);
}

/**
 * Check if a date is due today
 */
export function isDueToday(date: Date | string | null): boolean {
  if (!date) return false;
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return false;
  return isToday(d);
}

/**
 * Check if a date is within the next N days
 */
export function isWithinDays(date: Date | string | null, days: number): boolean {
  if (!date) return false;
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return false;
  
  const now = new Date();
  const futureDate = addDays(startOfDay(now), days);
  const targetDate = startOfDay(d);
  
  return targetDate >= startOfDay(now) && targetDate <= futureDate;
}

/**
 * Check if a date is this week
 */
export function isThisWeek(date: Date | string | null): boolean {
  if (!date) return false;
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return false;
  
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  
  return d >= weekStart && d <= weekEnd;
}

/**
 * Get the start and end of today
 */
export function getTodayRange(): { start: Date; end: Date } {
  const now = new Date();
  return {
    start: startOfDay(now),
    end: endOfDay(now),
  };
}

/**
 * Get the start and end of the current week
 */
export function getWeekRange(): { start: Date; end: Date } {
  const now = new Date();
  return {
    start: startOfWeek(now, { weekStartsOn: 1 }),
    end: endOfWeek(now, { weekStartsOn: 1 }),
  };
}

/**
 * Get the start and end of the next N days
 */
export function getNextDaysRange(days: number): { start: Date; end: Date } {
  const now = new Date();
  return {
    start: startOfDay(now),
    end: endOfDay(addDays(now, days)),
  };
}

/**
 * Get date groups for organizing tasks
 */
export type DateGroup = 'overdue' | 'today' | 'tomorrow' | 'thisWeek' | 'later' | 'noDate';

export function getDateGroup(date: Date | string | null): DateGroup {
  if (!date) return 'noDate';
  
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return 'noDate';
  
  const targetDate = startOfDay(d);
  const today = startOfDay(new Date());
  
  if (targetDate < today) return 'overdue';
  if (isToday(d)) return 'today';
  if (isTomorrow(d)) return 'tomorrow';
  if (isThisWeek(d)) return 'thisWeek';
  return 'later';
}

/**
 * Get label for a date group
 */
export function getDateGroupLabel(group: DateGroup): string {
  const labels: Record<DateGroup, string> = {
    overdue: 'Overdue',
    today: 'Today',
    tomorrow: 'Tomorrow',
    thisWeek: 'This Week',
    later: 'Later',
    noDate: 'No Date',
  };
  return labels[group];
}

/**
 * Convert date to ISO string for API
 */
export function toIsoString(date: Date | null): string | null {
  if (!date) return null;
  return date.toISOString();
}

/**
 * Parse date from various formats
 */
export function parseDate(value: Date | string | null): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  
  const parsed = parseISO(value);
  return isValid(parsed) ? parsed : null;
}

/**
 * Get days until a date
 */
export function getDaysUntil(date: Date | string | null): number | null {
  if (!date) return null;
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return null;
  
  return differenceInDays(startOfDay(d), startOfDay(new Date()));
}

export default {
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
};
