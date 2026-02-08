/**
 * useLists Hook
 * 
 * Fetch and manage lists with SWR.
 */

import useSWR from 'swr';
import type { List, ListWithTaskCount, CreateListInput, UpdateListInput } from '@/lib/db/schema';
import { api } from '@/lib/utils/api';

/**
 * Hook to fetch all lists with task counts
 */
export function useLists() {
  const { data, error, isLoading, mutate } = useSWR<ListWithTaskCount[]>(
    '/lists',
    async (url: string) => {
      const response = await api.get<ListWithTaskCount[]>(url);
      return response.data ?? [];
    }
  );

  const lists = data ?? [];

  return {
    lists,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

/**
 * Hook to fetch a single list by ID
 */
export function useList(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `/lists/${id}` : null,
    async () => {
      const response = await api.get<List>(`/lists/${id}`);
      return response.data;
    }
  );

  return {
    list: data,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

/**
 * Create a new list
 */
export async function createList(data: CreateListInput): Promise<List> {
  const response = await api.post<List>('/lists', data);
  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to create list');
  }
  return response.data;
}

/**
 * Update a list
 */
export async function updateList(id: string, data: UpdateListInput): Promise<List> {
  const response = await api.put<List>(`/lists/${id}`, data);
  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to update list');
  }
  return response.data;
}

/**
 * Delete a list
 */
export async function deleteList(id: string): Promise<void> {
  const response = await api.del<void>(`/lists/${id}`);
  if (!response.success) {
    throw new Error(response.error || 'Failed to delete list');
  }
}

/**
 * Hook for list mutations with optimistic updates
 */
export function useListMutations() {
  const { mutate: mutateLists, lists } = useLists();

  const create = async (data: CreateListInput) => {
    const tempId = `temp-${Date.now()}`;
    const tempList: ListWithTaskCount = {
      id: tempId,
      name: data.name,
      color: data.color || '#6366f1',
      emoji: data.emoji || null,
      is_default: data.is_default || false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      task_count: 0,
      completed_count: 0,
    };

    await mutateLists(
      async () => {
        const newList = await createList(data);
        return [...lists, { ...newList, task_count: 0, completed_count: 0 }];
      },
      {
        optimisticData: [...lists, tempList],
        rollbackOnError: true,
        revalidate: true,
      }
    );
  };

  const update = async (id: string, data: UpdateListInput) => {
    await mutateLists(
      async () => {
        const updatedList = await updateList(id, data);
        return lists.map((list) =>
          list.id === id ? { ...list, ...updatedList } : list
        );
      },
      {
        optimisticData: lists.map((list) =>
          list.id === id ? { ...list, ...data } : list
        ),
        rollbackOnError: true,
        revalidate: true,
      }
    );
  };

  const remove = async (id: string) => {
    await mutateLists(
      async () => {
        await deleteList(id);
        return lists.filter((list) => list.id !== id);
      },
      {
        optimisticData: lists.filter((list) => list.id !== id),
        rollbackOnError: true,
        revalidate: true,
      }
    );
  };

  return {
    create,
    update,
    remove,
  };
}

export default useLists;
