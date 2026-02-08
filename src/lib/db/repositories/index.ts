/**
 * Repositories Index
 * 
 * Exports all repository classes and their getter functions.
 */

// Base repository
export { BaseRepository, CompositeKeyRepository } from './base.repository';

// Entity repositories
export { ListsRepository, getListsRepository } from './lists.repository';
export { TasksRepository, getTasksRepository, escapeLikePattern } from './tasks.repository';
export type { TaskFilterOptions, PaginationOptions, PaginatedResult } from './tasks.repository';
export { LabelsRepository, getLabelsRepository, TaskLabelsRepository, getTaskLabelsRepository } from './labels.repository';
export { SubtasksRepository, getSubtasksRepository } from './subtasks.repository';
export { RemindersRepository, getRemindersRepository } from './reminders.repository';
export { AttachmentsRepository, getAttachmentsRepository } from './attachments.repository';
export { TaskHistoryRepository, getTaskHistoryRepository } from './task-history.repository';
export type { TaskHistoryWithDetails } from './task-history.repository';

// Convenience function to get all repositories
export function getAllRepositories() {
  return {
    lists: getListsRepository(),
    tasks: getTasksRepository(),
    labels: getLabelsRepository(),
    taskLabels: getTaskLabelsRepository(),
    subtasks: getSubtasksRepository(),
    reminders: getRemindersRepository(),
    attachments: getAttachmentsRepository(),
    taskHistory: getTaskHistoryRepository(),
  };
}
