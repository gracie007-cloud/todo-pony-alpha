/**
 * useLabels Hook
 * 
 * Fetch and manage labels with SWR.
 */

import useSWR from 'swr';
import type { Label, CreateLabelInput, UpdateLabelInput } from '@/lib/db/schema';
import { api } from '@/lib/utils/api';

/**
 * Hook to fetch all labels
 */
export function useLabels() {
  const { data, error, isLoading, mutate } = useSWR<Label[]>(
    '/labels',
    async (url: string) => {
      const response = await api.get<Label[]>(url);
      return response.data ?? [];
    }
  );

  const labels = data ?? [];

  return {
    labels,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

/**
 * Hook to fetch a single label by ID
 */
export function useLabel(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `/labels/${id}` : null,
    async () => {
      const response = await api.get<Label>(`/labels/${id}`);
      return response.data;
    }
  );

  return {
    label: data,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

/**
 * Create a new label
 */
export async function createLabel(data: CreateLabelInput): Promise<Label> {
  const response = await api.post<Label>('/labels', data);
  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to create label');
  }
  return response.data;
}

/**
 * Update a label
 */
export async function updateLabel(id: string, data: UpdateLabelInput): Promise<Label> {
  const response = await api.put<Label>(`/labels/${id}`, data);
  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to update label');
  }
  return response.data;
}

/**
 * Delete a label
 */
export async function deleteLabel(id: string): Promise<void> {
  const response = await api.del<void>(`/labels/${id}`);
  if (!response.success) {
    throw new Error(response.error || 'Failed to delete label');
  }
}

/**
 * Hook for label mutations with optimistic updates
 */
export function useLabelMutations() {
  const { mutate: mutateLabels, labels } = useLabels();

  const create = async (data: CreateLabelInput) => {
    const tempId = `temp-${Date.now()}`;
    const tempLabel: Label = {
      id: tempId,
      name: data.name,
      color: data.color || '#8b5cf6',
      icon: data.icon || null,
      created_at: new Date().toISOString(),
    };

    await mutateLabels(
      async () => {
        const newLabel = await createLabel(data);
        return [...labels, newLabel];
      },
      {
        optimisticData: [...labels, tempLabel],
        rollbackOnError: true,
        revalidate: true,
      }
    );
  };

  const update = async (id: string, data: UpdateLabelInput) => {
    await mutateLabels(
      async () => {
        const updatedLabel = await updateLabel(id, data);
        return labels.map((label) =>
          label.id === id ? updatedLabel : label
        );
      },
      {
        optimisticData: labels.map((label) =>
          label.id === id ? { ...label, ...data } : label
        ),
        rollbackOnError: true,
        revalidate: true,
      }
    );
  };

  const remove = async (id: string) => {
    await mutateLabels(
      async () => {
        await deleteLabel(id);
        return labels.filter((label) => label.id !== id);
      },
      {
        optimisticData: labels.filter((label) => label.id !== id),
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

export default useLabels;
