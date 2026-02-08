/**
 * useSubtasks Hook
 * 
 * Subtask management with SWR.
 */

import useSWR from 'swr';
import type { Subtask, CreateSubtaskInput, UpdateSubtaskInput } from '@/lib/db/schema';
import { api } from '@/lib/utils/api';

/**
 * Hook to fetch subtasks for a task
 */
export function useSubtasks(taskId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<Subtask[]>(
    taskId ? `/tasks/${taskId}/subtasks` : null,
    async (url: string) => {
      const response = await api.get<Subtask[]>(url);
      return response.data ?? [];
    }
  );

  const subtasks = data ?? [];

  return {
    subtasks,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

/**
 * Create a new subtask
 */
async function createSubtask(taskId: string, data: Omit<CreateSubtaskInput, 'task_id'>): Promise<Subtask> {
  const response = await api.post<Subtask>(`/tasks/${taskId}/subtasks`, {
    ...data,
    task_id: taskId,
  });
  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to create subtask');
  }
  return response.data;
}

/**
 * Update a subtask
 */
async function updateSubtask(taskId: string, subtaskId: string, data: UpdateSubtaskInput): Promise<Subtask> {
  const response = await api.put<Subtask>(`/tasks/${taskId}/subtasks/${subtaskId}`, data);
  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to update subtask');
  }
  return response.data;
}

/**
 * Delete a subtask
 */
async function deleteSubtask(taskId: string, subtaskId: string): Promise<void> {
  const response = await api.del<void>(`/tasks/${taskId}/subtasks/${subtaskId}`);
  if (!response.success) {
    throw new Error(response.error || 'Failed to delete subtask');
  }
}

/**
 * Hook for subtask mutations with optimistic updates
 */
export function useSubtaskMutations(taskId: string) {
  const { mutate: mutateSubtasks, subtasks } = useSubtasks(taskId);

  /**
   * Create a new subtask with optimistic update
   */
  const create = async (name: string) => {
    const tempId = `temp-${Date.now()}`;
    const now = new Date().toISOString();

    const optimisticSubtask: Subtask = {
      id: tempId,
      task_id: taskId,
      name,
      completed: false,
      order: subtasks.length,
      created_at: now,
    };

    await mutateSubtasks(
      async () => {
        const newSubtask = await createSubtask(taskId, { name, order: subtasks.length, completed: false });
        return [...subtasks, newSubtask];
      },
      {
        optimisticData: [...subtasks, optimisticSubtask],
        rollbackOnError: true,
        revalidate: true,
      }
    );
  };

  /**
   * Update a subtask with optimistic update
   */
  const update = async (subtaskId: string, data: UpdateSubtaskInput) => {
    await mutateSubtasks(
      async () => {
        const updatedSubtask = await updateSubtask(taskId, subtaskId, data);
        return subtasks.map((s) => (s.id === subtaskId ? updatedSubtask : s));
      },
      {
        optimisticData: subtasks.map((s) => (s.id === subtaskId ? { ...s, ...data } : s)),
        rollbackOnError: true,
        revalidate: true,
      }
    );
  };

  /**
   * Toggle subtask completion with optimistic update
   */
  const toggleComplete = async (subtaskId: string, completed: boolean) => {
    await update(subtaskId, { completed });
  };

  /**
   * Delete a subtask with optimistic update
   */
  const remove = async (subtaskId: string) => {
    await mutateSubtasks(
      async () => {
        await deleteSubtask(taskId, subtaskId);
        return subtasks.filter((s) => s.id !== subtaskId);
      },
      {
        optimisticData: subtasks.filter((s) => s.id !== subtaskId),
        rollbackOnError: true,
        revalidate: true,
      }
    );
  };

  /**
   * Reorder subtasks
   */
  const reorder = async (subtaskId: string, newOrder: number) => {
    const currentIndex = subtasks.findIndex((s) => s.id === subtaskId);
    if (currentIndex === -1) return;

    const newSubtasks = [...subtasks];
    const [removed] = newSubtasks.splice(currentIndex, 1);
    newSubtasks.splice(newOrder, 0, removed);

    // Update order property
    const reorderedSubtasks = newSubtasks.map((s, index) => ({
      ...s,
      order: index,
    }));

    await mutateSubtasks(
      async () => {
        // Update each subtask's order on the server
        await Promise.all(
          reorderedSubtasks.map((s) => updateSubtask(taskId, s.id, { order: s.order }))
        );
        return reorderedSubtasks;
      },
      {
        optimisticData: reorderedSubtasks,
        rollbackOnError: true,
        revalidate: true,
      }
    );
  };

  return {
    create,
    update,
    toggleComplete,
    remove,
    reorder,
  };
}

export default useSubtasks;
