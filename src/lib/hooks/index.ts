/**
 * Custom Hooks Index
 * 
 * Export all custom hooks.
 */

// Utility hooks
export { useDebounce } from './useDebounce';
export { useLocalStorage } from './useLocalStorage';
export { useMediaQuery, useIsMobile, useIsTablet, useIsDesktop, useIsLargeDesktop, usePrefersDarkMode, usePrefersReducedMotion } from './useMediaQuery';

// Data fetching hooks
export { useLists, useList, useListMutations, createList, updateList, deleteList } from './useLists';
export { useLabels, useLabel, useLabelMutations, createLabel, updateLabel, deleteLabel } from './useLabels';
export {
  useTasks,
  useTask,
  useTodayTasks,
  useOverdueTasks,
  useWeekTasks,
  useAllTasks,
  useCompletedTasks,
  useTasksByList,
  useTasksByLabel,
  createTask,
  updateTask,
  deleteTask,
  toggleTaskComplete,
  type TaskFilters,
} from './useTasks';
export { useTaskMutations, useTaskMutation } from './useTaskMutations';
export { useSubtasks, useSubtaskMutations } from './useSubtasks';
export { useTaskHistory, formatFieldName, formatFieldValue, getChangeDescription } from './useTaskHistory';

// Search hooks
export {
  useTaskSearch,
  useLabelSearch,
  useListSearch,
  useGlobalSearch,
  type SearchResult,
  type SearchOptions,
} from './useSearch';
