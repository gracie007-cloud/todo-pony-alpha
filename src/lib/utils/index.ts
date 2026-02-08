/**
 * Utilities Index
 * 
 * Export all utility functions.
 */

// API client
export { api, get, post, put, patch, del } from './api';
export type { ApiResponse, ApiError } from './api';

// Query parameters
export {
  buildQueryString,
  parseQueryString,
  mergeQueryParams,
  cleanParams,
} from './query-params';

// Date utilities
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
  type DateGroup,
} from './date-utils';

// Task utilities
export {
  isTaskOverdue,
  isTaskDueToday,
  isTaskDueWithin,
  getTaskEffectiveDate,
  groupTasksByDate,
  groupTasksByList,
  groupTasksByPriority,
  sortByPriority,
  sortByDate,
  sortByCreated,
  filterByCompletion,
  getIncompleteTasks,
  getCompletedTasks,
  getOverdueTasks,
  getTasksDueToday,
  getSubtaskProgress,
  hasSubtasks,
  areAllSubtasksCompleted,
  getPriorityColor,
  getPriorityLabel,
  getTaskCounts,
  searchTasks,
  searchTasksWithRelations,
  filterByList,
  filterByLabel,
  filterByLabels,
  getUniqueLabels,
  getUniqueLists,
} from './task-utils';

// View Transition utilities
export {
  supportsViewTransitions,
  prefersReducedMotion,
  withViewTransition,
  navigateWithTransition,
  setTransitionName,
  createTransitionName,
  VIEW_TRANSITION_CLASSES,
  TRANSITION_NAMES,
} from './view-transition';

// Re-export cn from utils.ts
export { cn } from '@/lib/utils';
