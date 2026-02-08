/**
 * useTasks Hook
 *
 * Fetch tasks with filtering, create/update/delete operations.
 */

import { useMemo } from 'react';
import useSWR from 'swr';
import type { TaskWithRelations, CreateTaskInput, UpdateTaskInput, Priority } from '@/lib/db/schema';
import { api } from '@/lib/utils/api';
import { buildQueryString } from '@/lib/utils/query-params';

export interface TaskFilters {
  listId?: string;
  dateFrom?: string;
  dateTo?: string;
  completed?: boolean;
  priority?: Priority;
  overdue?: boolean;
  search?: string;
  labelId?: string;
}

/**
 * Build cache key for tasks based on filters
 */
function buildTasksKey(filters: TaskFilters): string {
  const queryString = buildQueryString(filters as Record<string, unknown>);
  return `/tasks${queryString}`;
}

/**
 * Hook to fetch tasks with optional filtering
 */
export function useTasks(filters: TaskFilters = {}) {
  const key = buildTasksKey(filters);
  
  const { data, error, isLoading, mutate } = useSWR<TaskWithRelations[]>(
    key,
    async (url: string) => {
      const response = await api.get<TaskWithRelations[]>(url);
      return response.data ?? [];
    }
  );

  const tasks = data ?? [];

  return {
    tasks,
    count: tasks.length,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

/**
 * Hook to fetch a single task with relations by ID
 */
export function useTask(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `/tasks/${id}` : null,
    async () => {
      const response = await api.get<TaskWithRelations>(`/tasks/${id}`);
      return response.data;
    }
  );

  return {
    task: data,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

/**
 * Hook to fetch today's tasks
 */
export function useTodayTasks() {
  // Memoize date range to prevent unnecessary re-renders
  const { dateFrom, dateTo } = useMemo(() => {
    const today = new Date();
    const from = new Date(today);
    from.setHours(0, 0, 0, 0);
    const to = new Date(today);
    to.setHours(23, 59, 59, 999);
    return {
      dateFrom: from.toISOString(),
      dateTo: to.toISOString(),
    };
  }, []); // Empty deps - only calculate once per component mount

  return useTasks({
    dateFrom,
    dateTo,
    completed: false,
  });
}

/**
 * Hook to fetch overdue tasks
 */
export function useOverdueTasks() {
  return useTasks({
    overdue: true,
  });
}

/**
 * Hook to fetch tasks for the next 7 days
 */
export function useWeekTasks() {
  // Memoize date range to prevent unnecessary re-renders
  const { dateFrom, dateTo } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const from = today.toISOString();
    const to = new Date(today);
    to.setDate(to.getDate() + 7);
    
    return {
      dateFrom: from,
      dateTo: to.toISOString(),
    };
  }, []); // Empty deps - only calculate once per component mount
  
  return useTasks({
    dateFrom,
    dateTo,
    completed: false,
  });
}

/**
 * Hook to fetch all incomplete tasks
 */
export function useAllTasks() {
  return useTasks({
    completed: false,
  });
}

/**
 * Hook to fetch completed tasks
 */
export function useCompletedTasks() {
  return useTasks({
    completed: true,
  });
}

/**
 * Hook to fetch tasks by list
 */
export function useTasksByList(listId: string | null) {
  return useTasks({
    listId: listId ?? undefined,
    completed: false,
  });
}

/**
 * Hook to fetch tasks by label
 */
export function useTasksByLabel(labelId: string | null) {
  return useTasks({
    labelId: labelId ?? undefined,
    completed: false,
  });
}

/**
 * Create a new task
 */
export async function createTask(data: CreateTaskInput): Promise<TaskWithRelations> {
  const response = await api.post<TaskWithRelations>('/tasks', data);
  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to create task');
  }
  return response.data;
}

/**
 * Update a task
 */
export async function updateTask(id: string, data: UpdateTaskInput): Promise<TaskWithRelations> {
  const response = await api.put<TaskWithRelations>(`/tasks/${id}`, data);
  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to update task');
  }
  return response.data;
}

/**
 * Delete a task
 */
export async function deleteTask(id: string): Promise<void> {
  const response = await api.del<void>(`/tasks/${id}`);
  if (!response.success) {
    throw new Error(response.error || 'Failed to delete task');
  }
}

/**
 * Toggle task completion
 */
export async function toggleTaskComplete(id: string, completed: boolean): Promise<TaskWithRelations> {
  return updateTask(id, { completed });
}

export default useTasks;
