/**
 * useTaskHistory Hook
 * 
 * Fetch task change history with SWR.
 */

import useSWR from 'swr';
import type { TaskHistory } from '@/lib/db/schema';
import { api } from '@/lib/utils/api';

interface TaskHistoryResponse {
  success: boolean;
  data: TaskHistory[];
}

/**
 * Hook to fetch change history for a task
 */
export function useTaskHistory(taskId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<TaskHistory[]>(
    taskId ? `/tasks/${taskId}/history` : null,
    async (url: string) => {
      const response = await api.get<TaskHistory[]>(url);
      return response.data ?? [];
    }
  );

  const history = data ?? [];

  return {
    history,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

/**
 * Format field name for display
 */
export function formatFieldName(field: string): string {
  const fieldNames: Record<string, string> = {
    name: 'Name',
    description: 'Description',
    list_id: 'List',
    date: 'Due Date',
    deadline: 'Deadline',
    estimate_minutes: 'Estimated Time',
    actual_minutes: 'Actual Time',
    priority: 'Priority',
    recurring_rule: 'Recurrence',
    completed: 'Status',
    completed_at: 'Completed At',
  };

  return fieldNames[field] || field;
}

/**
 * Format field value for display
 */
export function formatFieldValue(field: string, value: string | null): string {
  if (value === null || value === 'null') return 'None';

  switch (field) {
    case 'completed':
      return value === 'true' ? 'Completed' : 'Not Completed';
    case 'priority':
      const priorityLabels: Record<string, string> = {
        high: 'High',
        medium: 'Medium',
        low: 'Low',
        none: 'None',
      };
      return priorityLabels[value] || value;
    case 'estimate_minutes':
    case 'actual_minutes':
      const minutes = parseInt(value, 10);
      if (isNaN(minutes)) return value;
      if (minutes < 60) return `${minutes} min`;
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    default:
      // Try to parse JSON values
      try {
        const parsed = JSON.parse(value);
        if (typeof parsed === 'string') return parsed;
        return JSON.stringify(parsed);
      } catch {
        return value;
      }
  }
}

/**
 * Get a human-readable description of a change
 */
export function getChangeDescription(change: TaskHistory): string {
  const fieldName = formatFieldName(change.field_name);
  const oldValue = formatFieldValue(change.field_name, change.old_value);
  const newValue = formatFieldValue(change.field_name, change.new_value);

  if (change.field_name === 'completed') {
    return change.new_value === 'true'
      ? `Marked as completed`
      : `Marked as incomplete`;
  }

  if (!change.old_value || change.old_value === 'null') {
    return `Set ${fieldName.toLowerCase()} to "${newValue}"`;
  }

  if (!change.new_value || change.new_value === 'null') {
    return `Removed ${fieldName.toLowerCase()}`;
  }

  return `Changed ${fieldName.toLowerCase()} from "${oldValue}" to "${newValue}"`;
}

export default useTaskHistory;
