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
  const { getListsRepository } = require('./lists.repository');
  const { getTasksRepository } = require('./tasks.repository');
  const { getLabelsRepository, getTaskLabelsRepository } = require('./labels.repository');
  const { getSubtasksRepository } = require('./subtasks.repository');
  const { getRemindersRepository } = require('./reminders.repository');
  const { getAttachmentsRepository } = require('./attachments.repository');
  const { getTaskHistoryRepository } = require('./task-history.repository');
  
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
