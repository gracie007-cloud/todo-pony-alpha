/**
 * useTaskMutations Hook
 * 
 * Task CRUD mutations with optimistic updates.
 */

import { useCallback } from 'react';
import useSWRMutation from 'swr/mutation';
import type { TaskWithRelations, CreateTaskInput, UpdateTaskInput } from '@/lib/db/schema';
import { api } from '@/lib/utils/api';
import { useTasks, createTask, updateTask, deleteTask } from './useTasks';

/**
 * Generate a temporary ID for optimistic updates
 */
function generateTempId(): string {
  return `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Hook for task mutations with optimistic updates
 */
export function useTaskMutations(filters = {}) {
  const { mutate: mutateTasks, tasks } = useTasks(filters);

  /**
   * Create a new task with optimistic update
   */
  const create = useCallback(
    async (data: CreateTaskInput) => {
      const tempId = generateTempId();
      const now = new Date().toISOString();

      // Create optimistic task
      const optimisticTask: TaskWithRelations = {
        id: tempId,
        list_id: data.list_id,
        name: data.name,
        description: data.description ?? null,
        date: data.date ?? null,
        deadline: data.deadline ?? null,
        estimate_minutes: data.estimate_minutes ?? null,
        actual_minutes: data.actual_minutes ?? null,
        priority: data.priority ?? 'none',
        recurring_rule: data.recurring_rule ?? null,
        completed: false,
        completed_at: null,
        created_at: now,
        updated_at: now,
        list: {
          id: data.list_id,
          name: '',
          color: '#6366f1',
          emoji: null,
          is_default: false,
          created_at: now,
          updated_at: now,
        },
        subtasks: [],
        labels: [],
        reminders: [],
        attachments: [],
      };

      // Optimistic update
      await mutateTasks(
        async () => {
          const newTask = await createTask(data);
          return [...tasks, newTask];
        },
        {
          optimisticData: [...tasks, optimisticTask],
          rollbackOnError: true,
          revalidate: true,
        }
      );
    },
    [mutateTasks, tasks]
  );

  /**
   * Update a task with optimistic update
   */
  const update = useCallback(
    async (id: string, data: UpdateTaskInput) => {
      await mutateTasks(
        async () => {
          const updatedTask = await updateTask(id, data);
          return tasks.map((task) =>
            task.id === id ? updatedTask : task
          );
        },
        {
          optimisticData: tasks.map((task) =>
            task.id === id ? { ...task, ...data } : task
          ),
          rollbackOnError: true,
          revalidate: true,
        }
      );
    },
    [mutateTasks, tasks]
  );

  /**
   * Delete a task with optimistic update
   */
  const remove = useCallback(
    async (id: string) => {
      await mutateTasks(
        async () => {
          await deleteTask(id);
          return tasks.filter((task) => task.id !== id);
        },
        {
          optimisticData: tasks.filter((task) => task.id !== id),
          rollbackOnError: true,
          revalidate: true,
        }
      );
    },
    [mutateTasks, tasks]
  );

  /**
   * Toggle task completion with optimistic update
   */
  const toggleComplete = useCallback(
    async (id: string, completed: boolean) => {
      const now = completed ? new Date().toISOString() : null;

      await mutateTasks(
        async () => {
          const updatedTask = await updateTask(id, { completed });
          return tasks.map((task) =>
            task.id === id ? updatedTask : task
          );
        },
        {
          optimisticData: tasks.map((task) =>
            task.id === id
              ? { ...task, completed, completed_at: now }
              : task
          ),
          rollbackOnError: true,
          revalidate: true,
        }
      );
    },
    [mutateTasks, tasks]
  );

  /**
   * Move task to a different list
   */
  const moveToList = useCallback(
    async (id: string, listId: string) => {
      await update(id, { list_id: listId });
    },
    [update]
  );

  /**
   * Update task priority
   */
  const setPriority = useCallback(
    async (id: string, priority: 'high' | 'medium' | 'low' | 'none') => {
      await update(id, { priority });
    },
    [update]
  );

  /**
   * Update task due date
   */
  const setDueDate = useCallback(
    async (id: string, date: string | null) => {
      await update(id, { date });
    },
    [update]
  );

  return {
    create,
    update,
    remove,
    toggleComplete,
    moveToList,
    setPriority,
    setDueDate,
  };
}

/**
 * Hook for single task operations using SWR Mutation
 */
export function useTaskMutation(id: string) {
  const {
    trigger: updateTrigger,
    isMutating,
    error,
  } = useSWRMutation(
    `/tasks/${id}`,
    async (url, { arg }: { arg: UpdateTaskInput }) => {
      const response = await api.put<TaskWithRelations>(url, arg);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to update task');
      }
      return response.data;
    }
  );

  return {
    update: updateTrigger,
    isMutating,
    error,
  };
}

export default useTaskMutations;
