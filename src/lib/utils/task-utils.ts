/**
 * Task Utilities
 * 
 * Task-related utilities for filtering, grouping, and manipulation.
 */

import type { Task, TaskWithRelations, Priority, List, Label } from '@/lib/db/schema';
import { getDateGroup, type DateGroup, isOverdue, parseDate } from './date-utils';

/**
 * Check if a task is overdue
 */
export function isTaskOverdue(task: Task): boolean {
  if (task.completed) return false;
  return isOverdue(task.deadline) || isOverdue(task.date);
}

/**
 * Check if a task is due today
 */
export function isTaskDueToday(task: Task): boolean {
  if (task.completed) return false;
  const date = task.date || task.deadline;
  if (!date) return false;
  
  const taskDate = parseDate(date);
  if (!taskDate) return false;
  
  const today = new Date();
  return taskDate.toDateString() === today.toDateString();
}

/**
 * Check if a task is due within the next N days
 */
export function isTaskDueWithin(task: Task, days: number): boolean {
  if (task.completed) return false;
  const date = task.date || task.deadline;
  if (!date) return false;
  
  const taskDate = parseDate(date);
  if (!taskDate) return false;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const futureDate = new Date(today);
  futureDate.setDate(futureDate.getDate() + days);
  
  return taskDate >= today && taskDate <= futureDate;
}

/**
 * Get the effective date for a task (date or deadline)
 */
export function getTaskEffectiveDate(task: Task): Date | null {
  return parseDate(task.date || task.deadline);
}

/**
 * Group tasks by date
 */
export function groupTasksByDate(tasks: Task[]): Record<DateGroup, Task[]> {
  const groups: Record<DateGroup, Task[]> = {
    overdue: [],
    today: [],
    tomorrow: [],
    thisWeek: [],
    later: [],
    noDate: [],
  };
  
  for (const task of tasks) {
    const date = task.date || task.deadline;
    const group = getDateGroup(date);
    groups[group].push(task);
  }
  
  return groups;
}

/**
 * Group tasks by list
 */
export function groupTasksByList(tasks: Task[]): Record<string, Task[]> {
  return tasks.reduce((acc, task) => {
    const listId = task.list_id;
    if (!acc[listId]) {
      acc[listId] = [];
    }
    acc[listId].push(task);
    return acc;
  }, {} as Record<string, Task[]>);
}

/**
 * Group tasks by priority
 */
export function groupTasksByPriority(tasks: Task[]): Record<Priority, Task[]> {
  const groups: Record<Priority, Task[]> = {
    high: [],
    medium: [],
    low: [],
    none: [],
  };
  
  for (const task of tasks) {
    groups[task.priority].push(task);
  }
  
  return groups;
}

/**
 * Sort tasks by priority (high to low)
 */
export function sortByPriority(tasks: Task[]): Task[] {
  const priorityOrder: Record<Priority, number> = {
    high: 0,
    medium: 1,
    low: 2,
    none: 3,
  };
  
  return [...tasks].sort((a, b) => {
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

/**
 * Sort tasks by date (earliest first)
 */
export function sortByDate(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    const dateA = a.date || a.deadline;
    const dateB = b.date || b.deadline;
    
    if (!dateA && !dateB) return 0;
    if (!dateA) return 1;
    if (!dateB) return -1;
    
    return new Date(dateA).getTime() - new Date(dateB).getTime();
  });
}

/**
 * Sort tasks by creation date (newest first)
 */
export function sortByCreated(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

/**
 * Filter tasks by completion status
 */
export function filterByCompletion(tasks: Task[], completed: boolean): Task[] {
  return tasks.filter(task => task.completed === completed);
}

/**
 * Filter incomplete tasks
 */
export function getIncompleteTasks(tasks: Task[]): Task[] {
  return filterByCompletion(tasks, false);
}

/**
 * Filter completed tasks
 */
export function getCompletedTasks(tasks: Task[]): Task[] {
  return filterByCompletion(tasks, true);
}

/**
 * Get overdue tasks
 */
export function getOverdueTasks(tasks: Task[]): Task[] {
  return tasks.filter(isTaskOverdue);
}

/**
 * Get tasks due today
 */
export function getTasksDueToday(tasks: Task[]): Task[] {
  return tasks.filter(isTaskDueToday);
}

/**
 * Calculate subtask progress
 */
export function getSubtaskProgress(task: TaskWithRelations): { completed: number; total: number } {
  const subtasks = task.subtasks || [];
  return {
    completed: subtasks.filter(s => s.completed).length,
    total: subtasks.length,
  };
}

/**
 * Check if a task has subtasks
 */
export function hasSubtasks(task: TaskWithRelations): boolean {
  return task.subtasks && task.subtasks.length > 0;
}

/**
 * Check if all subtasks are completed
 */
export function areAllSubtasksCompleted(task: TaskWithRelations): boolean {
  if (!hasSubtasks(task)) return false;
  return task.subtasks.every(s => s.completed);
}

/**
 * Get priority color
 */
export function getPriorityColor(priority: Priority): string {
  const colors: Record<Priority, string> = {
    high: '#ef4444',   // red
    medium: '#f59e0b', // amber
    low: '#3b82f6',    // blue
    none: '#6b7280',   // gray
  };
  return colors[priority];
}

/**
 * Get priority label
 */
export function getPriorityLabel(priority: Priority): string {
  const labels: Record<Priority, string> = {
    high: 'High Priority',
    medium: 'Medium Priority',
    low: 'Low Priority',
    none: 'No Priority',
  };
  return labels[priority];
}

/**
 * Count tasks by status
 */
export function getTaskCounts(tasks: Task[]): { total: number; completed: number; incomplete: number; overdue: number } {
  return {
    total: tasks.length,
    completed: getCompletedTasks(tasks).length,
    incomplete: getIncompleteTasks(tasks).length,
    overdue: getOverdueTasks(tasks).length,
  };
}

/**
 * Search tasks by query
 */
export function searchTasks(tasks: Task[], query: string): Task[] {
  if (!query.trim()) return tasks;
  
  const lowerQuery = query.toLowerCase().trim();
  
  return tasks.filter(task => {
    const nameMatch = task.name.toLowerCase().includes(lowerQuery);
    const descMatch = task.description?.toLowerCase().includes(lowerQuery);
    return nameMatch || descMatch;
  });
}

/**
 * Search tasks with relations by query (includes labels)
 */
export function searchTasksWithRelations(tasks: TaskWithRelations[], query: string): TaskWithRelations[] {
  if (!query.trim()) return tasks;
  
  const lowerQuery = query.toLowerCase().trim();
  
  return tasks.filter(task => {
    const nameMatch = task.name.toLowerCase().includes(lowerQuery);
    const descMatch = task.description?.toLowerCase().includes(lowerQuery);
    const labelMatch = task.labels?.some(label => 
      label.name.toLowerCase().includes(lowerQuery)
    );
    const listMatch = task.list?.name.toLowerCase().includes(lowerQuery);
    
    return nameMatch || descMatch || labelMatch || listMatch;
  });
}

/**
 * Filter tasks by list ID
 */
export function filterByList(tasks: Task[], listId: string): Task[] {
  return tasks.filter(task => task.list_id === listId);
}

/**
 * Filter tasks by label ID
 */
export function filterByLabel(tasks: TaskWithRelations[], labelId: string): TaskWithRelations[] {
  return tasks.filter(task => 
    task.labels?.some(label => label.id === labelId)
  );
}

/**
 * Filter tasks by multiple labels (AND)
 */
export function filterByLabels(tasks: TaskWithRelations[], labelIds: string[]): TaskWithRelations[] {
  if (labelIds.length === 0) return tasks;
  
  return tasks.filter(task => 
    labelIds.every(labelId => 
      task.labels?.some(label => label.id === labelId)
    )
  );
}

/**
 * Get unique labels from tasks
 */
export function getUniqueLabels(tasks: TaskWithRelations[]): Label[] {
  const labelMap = new Map<string, Label>();
  
  for (const task of tasks) {
    for (const label of task.labels || []) {
      if (!labelMap.has(label.id)) {
        labelMap.set(label.id, label);
      }
    }
  }
  
  return Array.from(labelMap.values());
}

/**
 * Get unique lists from tasks
 */
export function getUniqueLists(tasks: TaskWithRelations[]): List[] {
  const listMap = new Map<string, List>();
  
  for (const task of tasks) {
    if (task.list && !listMap.has(task.list.id)) {
      listMap.set(task.list.id, task.list);
    }
  }
  
  return Array.from(listMap.values());
}

export default {
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
};
