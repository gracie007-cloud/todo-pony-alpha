/**
 * Task Utilities Tests
 * 
 * Tests for isOverdue, groupByDate, sortByPriority.
 */

import { describe, test, expect, beforeEach } from 'bun:test';
import {
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
} from '@/lib/utils/task-utils';
import type { Task, TaskWithRelations, Priority, List, Label } from '@/lib/db/schema';
import { testDates, createTestTask, createTestList, createTestLabel } from '../utils/fixtures';

// Helper to create a complete task for testing
function createTask(overrides: Partial<Task> = {}): Task {
  return {
    id: crypto.randomUUID(),
    list_id: crypto.randomUUID(),
    name: 'Test Task',
    description: null,
    date: null,
    deadline: null,
    estimate_minutes: null,
    actual_minutes: null,
    priority: 'none',
    recurring_rule: null,
    completed: false,
    completed_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

// Helper to create task with relations
function createTaskWithRelations(
  taskOverrides: Partial<Task> = {},
  relations: {
    list?: List;
    subtasks?: TaskWithRelations['subtasks'];
    labels?: Label[];
    reminders?: TaskWithRelations['reminders'];
    attachments?: TaskWithRelations['attachments'];
  } = {}
): TaskWithRelations {
  const task = createTask(taskOverrides);
  return {
    ...task,
    list: relations.list || createTestList({ id: task.list_id }),
    subtasks: relations.subtasks || [],
    labels: relations.labels || [],
    reminders: relations.reminders || [],
    attachments: relations.attachments || [],
  };
}

describe('Task Utilities', () => {
  describe('isTaskOverdue', () => {
    test('should return false for completed task', () => {
      const task = createTask({ completed: true, deadline: testDates.yesterday });
      expect(isTaskOverdue(task)).toBe(false);
    });
    
    test('should return true for incomplete task with past deadline', () => {
      const task = createTask({ deadline: testDates.yesterday });
      expect(isTaskOverdue(task)).toBe(true);
    });
    
    test('should return false for future deadline', () => {
      const task = createTask({ deadline: testDates.tomorrow });
      expect(isTaskOverdue(task)).toBe(false);
    });
    
    test('should return false for task with no date', () => {
      const task = createTask();
      expect(isTaskOverdue(task)).toBe(false);
    });
    
    test('should check date field as well', () => {
      const task = createTask({ date: testDates.yesterday });
      expect(isTaskOverdue(task)).toBe(true);
    });
  });
  
  describe('isTaskDueToday', () => {
    test('should return true for task due today', () => {
      const task = createTask({ date: testDates.today });
      expect(isTaskDueToday(task)).toBe(true);
    });
    
    test('should return false for completed task', () => {
      const task = createTask({ completed: true, date: testDates.today });
      expect(isTaskDueToday(task)).toBe(false);
    });
    
    test('should return false for task due tomorrow', () => {
      const task = createTask({ date: testDates.tomorrow });
      expect(isTaskDueToday(task)).toBe(false);
    });
    
    test('should return false for task with no date', () => {
      const task = createTask();
      expect(isTaskDueToday(task)).toBe(false);
    });
  });
  
  describe('isTaskDueWithin', () => {
    test('should return true for task due within days', () => {
      const task = createTask({ date: testDates.tomorrow });
      expect(isTaskDueWithin(task, 3)).toBe(true);
    });
    
    test('should return false for task outside range', () => {
      const task = createTask({ date: testDates.nextWeek });
      expect(isTaskDueWithin(task, 3)).toBe(false);
    });
    
    test('should return false for completed task', () => {
      const task = createTask({ completed: true, date: testDates.tomorrow });
      expect(isTaskDueWithin(task, 3)).toBe(false);
    });
  });
  
  describe('getTaskEffectiveDate', () => {
    test('should return date if set', () => {
      const task = createTask({ date: testDates.today });
      const result = getTaskEffectiveDate(task);
      expect(result).toBeInstanceOf(Date);
    });
    
    test('should return deadline if date not set', () => {
      const task = createTask({ deadline: testDates.tomorrow });
      const result = getTaskEffectiveDate(task);
      expect(result).toBeInstanceOf(Date);
    });
    
    test('should prefer date over deadline', () => {
      const task = createTask({ date: testDates.today, deadline: testDates.tomorrow });
      const result = getTaskEffectiveDate(task);
      expect(result).toBeInstanceOf(Date);
    });
    
    test('should return null if no date', () => {
      const task = createTask();
      expect(getTaskEffectiveDate(task)).toBeNull();
    });
  });
  
  describe('groupTasksByDate', () => {
    test('should group tasks correctly', () => {
      const tasks = [
        createTask({ name: 'Overdue', date: testDates.yesterday }),
        createTask({ name: 'Today', date: testDates.today }),
        createTask({ name: 'Tomorrow', date: testDates.tomorrow }),
        createTask({ name: 'No Date' }),
      ];
      
      const groups = groupTasksByDate(tasks);
      
      expect(groups.overdue.length).toBe(1);
      expect(groups.today.length).toBe(1);
      expect(groups.tomorrow.length).toBe(1);
      expect(groups.noDate.length).toBe(1);
    });
  });
  
  describe('groupTasksByList', () => {
    test('should group tasks by list', () => {
      const listId1 = crypto.randomUUID();
      const listId2 = crypto.randomUUID();
      
      const tasks = [
        createTask({ list_id: listId1, name: 'Task 1' }),
        createTask({ list_id: listId1, name: 'Task 2' }),
        createTask({ list_id: listId2, name: 'Task 3' }),
      ];
      
      const groups = groupTasksByList(tasks);
      
      expect(groups[listId1].length).toBe(2);
      expect(groups[listId2].length).toBe(1);
    });
  });
  
  describe('groupTasksByPriority', () => {
    test('should group tasks by priority', () => {
      const tasks = [
        createTask({ priority: 'high' }),
        createTask({ priority: 'high' }),
        createTask({ priority: 'low' }),
        createTask({ priority: 'none' }),
      ];
      
      const groups = groupTasksByPriority(tasks);
      
      expect(groups.high.length).toBe(2);
      expect(groups.medium.length).toBe(0);
      expect(groups.low.length).toBe(1);
      expect(groups.none.length).toBe(1);
    });
  });
  
  describe('sortByPriority', () => {
    test('should sort by priority high to low', () => {
      const tasks = [
        createTask({ name: 'Low', priority: 'low' }),
        createTask({ name: 'High', priority: 'high' }),
        createTask({ name: 'None', priority: 'none' }),
        createTask({ name: 'Medium', priority: 'medium' }),
      ];
      
      const sorted = sortByPriority(tasks);
      
      expect(sorted[0].priority).toBe('high');
      expect(sorted[1].priority).toBe('medium');
      expect(sorted[2].priority).toBe('low');
      expect(sorted[3].priority).toBe('none');
    });
    
    test('should not modify original array', () => {
      const tasks = [
        createTask({ priority: 'low' }),
        createTask({ priority: 'high' }),
      ];
      
      sortByPriority(tasks);
      
      expect(tasks[0].priority).toBe('low');
    });
  });
  
  describe('sortByDate', () => {
    test('should sort by date earliest first', () => {
      const tasks = [
        createTask({ name: 'Later', date: testDates.nextWeek }),
        createTask({ name: 'Sooner', date: testDates.tomorrow }),
        createTask({ name: 'No Date' }),
      ];
      
      const sorted = sortByDate(tasks);
      
      expect(sorted[0].name).toBe('Sooner');
      expect(sorted[1].name).toBe('Later');
      expect(sorted[2].name).toBe('No Date');
    });
  });
  
  describe('sortByCreated', () => {
    test('should sort by created date newest first', () => {
      const tasks = [
        createTask({ name: 'Old', created_at: testDates.yesterday }),
        createTask({ name: 'New', created_at: testDates.tomorrow }),
      ];
      
      const sorted = sortByCreated(tasks);
      
      expect(sorted[0].name).toBe('New');
      expect(sorted[1].name).toBe('Old');
    });
  });
  
  describe('filterByCompletion', () => {
    test('should filter completed tasks', () => {
      const tasks = [
        createTask({ completed: true }),
        createTask({ completed: false }),
        createTask({ completed: true }),
      ];
      
      const completed = filterByCompletion(tasks, true);
      expect(completed.length).toBe(2);
      
      const incomplete = filterByCompletion(tasks, false);
      expect(incomplete.length).toBe(1);
    });
  });
  
  describe('getIncompleteTasks', () => {
    test('should return only incomplete tasks', () => {
      const tasks = [
        createTask({ completed: false }),
        createTask({ completed: true }),
      ];
      
      const result = getIncompleteTasks(tasks);
      expect(result.length).toBe(1);
      expect(result[0].completed).toBe(false);
    });
  });
  
  describe('getCompletedTasks', () => {
    test('should return only completed tasks', () => {
      const tasks = [
        createTask({ completed: false }),
        createTask({ completed: true }),
      ];
      
      const result = getCompletedTasks(tasks);
      expect(result.length).toBe(1);
      expect(result[0].completed).toBe(true);
    });
  });
  
  describe('getOverdueTasks', () => {
    test('should return only overdue tasks', () => {
      const tasks = [
        createTask({ deadline: testDates.yesterday }),
        createTask({ deadline: testDates.tomorrow }),
      ];
      
      const result = getOverdueTasks(tasks);
      expect(result.length).toBe(1);
    });
  });
  
  describe('getTasksDueToday', () => {
    test('should return only tasks due today', () => {
      const tasks = [
        createTask({ date: testDates.today }),
        createTask({ date: testDates.tomorrow }),
      ];
      
      const result = getTasksDueToday(tasks);
      expect(result.length).toBe(1);
    });
  });
  
  describe('getSubtaskProgress', () => {
    test('should calculate subtask progress', () => {
      const task = createTaskWithRelations({}, {
        subtasks: [
          { id: '1', task_id: 't1', name: 'Done', completed: true, order: 0, created_at: testDates.now },
          { id: '2', task_id: 't1', name: 'Pending', completed: false, order: 1, created_at: testDates.now },
          { id: '3', task_id: 't1', name: 'Done 2', completed: true, order: 2, created_at: testDates.now },
        ],
      });
      
      const progress = getSubtaskProgress(task);
      
      expect(progress.completed).toBe(2);
      expect(progress.total).toBe(3);
    });
    
    test('should return 0 for no subtasks', () => {
      const task = createTaskWithRelations();
      const progress = getSubtaskProgress(task);
      
      expect(progress.completed).toBe(0);
      expect(progress.total).toBe(0);
    });
  });
  
  describe('hasSubtasks', () => {
    test('should return true for task with subtasks', () => {
      const task = createTaskWithRelations({}, {
        subtasks: [{ id: '1', task_id: 't1', name: 'Sub', completed: false, order: 0, created_at: testDates.now }],
      });
      
      expect(hasSubtasks(task)).toBe(true);
    });
    
    test('should return false for task without subtasks', () => {
      const task = createTaskWithRelations();
      expect(hasSubtasks(task)).toBe(false);
    });
  });
  
  describe('areAllSubtasksCompleted', () => {
    test('should return true when all completed', () => {
      const task = createTaskWithRelations({}, {
        subtasks: [
          { id: '1', task_id: 't1', name: 'Done', completed: true, order: 0, created_at: testDates.now },
          { id: '2', task_id: 't1', name: 'Done 2', completed: true, order: 1, created_at: testDates.now },
        ],
      });
      
      expect(areAllSubtasksCompleted(task)).toBe(true);
    });
    
    test('should return false when some incomplete', () => {
      const task = createTaskWithRelations({}, {
        subtasks: [
          { id: '1', task_id: 't1', name: 'Done', completed: true, order: 0, created_at: testDates.now },
          { id: '2', task_id: 't1', name: 'Pending', completed: false, order: 1, created_at: testDates.now },
        ],
      });
      
      expect(areAllSubtasksCompleted(task)).toBe(false);
    });
    
    test('should return false for no subtasks', () => {
      const task = createTaskWithRelations();
      expect(areAllSubtasksCompleted(task)).toBe(false);
    });
  });
  
  describe('getPriorityColor', () => {
    test('should return correct colors', () => {
      expect(getPriorityColor('high')).toBe('#ef4444');
      expect(getPriorityColor('medium')).toBe('#f59e0b');
      expect(getPriorityColor('low')).toBe('#3b82f6');
      expect(getPriorityColor('none')).toBe('#6b7280');
    });
  });
  
  describe('getPriorityLabel', () => {
    test('should return correct labels', () => {
      expect(getPriorityLabel('high')).toBe('High Priority');
      expect(getPriorityLabel('medium')).toBe('Medium Priority');
      expect(getPriorityLabel('low')).toBe('Low Priority');
      expect(getPriorityLabel('none')).toBe('No Priority');
    });
  });
  
  describe('getTaskCounts', () => {
    test('should calculate correct counts', () => {
      const tasks = [
        createTask({ completed: false, deadline: testDates.yesterday }),
        createTask({ completed: true }),
        createTask({ completed: false }),
      ];
      
      const counts = getTaskCounts(tasks);
      
      expect(counts.total).toBe(3);
      expect(counts.completed).toBe(1);
      expect(counts.incomplete).toBe(2);
      expect(counts.overdue).toBe(1);
    });
  });
  
  describe('searchTasks', () => {
    test('should find tasks by name', () => {
      const tasks = [
        createTask({ name: 'Buy groceries' }),
        createTask({ name: 'Walk the dog' }),
        createTask({ name: 'Buy tickets' }),
      ];
      
      const results = searchTasks(tasks, 'buy');
      
      expect(results.length).toBe(2);
    });
    
    test('should find tasks by description', () => {
      const tasks = [
        createTask({ name: 'Task 1', description: 'Important meeting' }),
        createTask({ name: 'Task 2', description: 'Call client' }),
      ];
      
      const results = searchTasks(tasks, 'meeting');
      
      expect(results.length).toBe(1);
    });
    
    test('should be case insensitive', () => {
      const tasks = [
        createTask({ name: 'IMPORTANT Task' }),
      ];
      
      const results = searchTasks(tasks, 'important');
      
      expect(results.length).toBe(1);
    });
    
    test('should return all tasks for empty query', () => {
      const tasks = [
        createTask({ name: 'Task 1' }),
        createTask({ name: 'Task 2' }),
      ];
      
      const results = searchTasks(tasks, '');
      
      expect(results.length).toBe(2);
    });
  });
  
  describe('searchTasksWithRelations', () => {
    test('should find tasks by label name', () => {
      const tasks = [
        createTaskWithRelations({ name: 'Task 1' }, {
          labels: [createTestLabel({ name: 'Work' })],
        }),
        createTaskWithRelations({ name: 'Task 2' }, {
          labels: [createTestLabel({ name: 'Personal' })],
        }),
      ];
      
      const results = searchTasksWithRelations(tasks, 'work');
      
      expect(results.length).toBe(1);
    });
    
    test('should find tasks by list name', () => {
      const tasks = [
        createTaskWithRelations({}, {
          list: createTestList({ name: 'Shopping List' }),
        }),
        createTaskWithRelations({}, {
          list: createTestList({ name: 'Work List' }),
        }),
      ];
      
      const results = searchTasksWithRelations(tasks, 'shopping');
      
      expect(results.length).toBe(1);
    });
  });
  
  describe('filterByList', () => {
    test('should filter tasks by list ID', () => {
      const listId = crypto.randomUUID();
      const tasks = [
        createTask({ list_id: listId }),
        createTask({ list_id: crypto.randomUUID() }),
      ];
      
      const results = filterByList(tasks, listId);
      
      expect(results.length).toBe(1);
    });
  });
  
  describe('filterByLabel', () => {
    test('should filter tasks by label ID', () => {
      const labelId = crypto.randomUUID();
      const tasks = [
        createTaskWithRelations({}, {
          labels: [createTestLabel({ id: labelId })],
        }),
        createTaskWithRelations({}, {
          labels: [createTestLabel()],
        }),
      ];
      
      const results = filterByLabel(tasks, labelId);
      
      expect(results.length).toBe(1);
    });
  });
  
  describe('filterByLabels', () => {
    test('should filter tasks with all labels (AND)', () => {
      const label1 = crypto.randomUUID();
      const label2 = crypto.randomUUID();
      
      const tasks = [
        createTaskWithRelations({}, {
          labels: [createTestLabel({ id: label1 }), createTestLabel({ id: label2 })],
        }),
        createTaskWithRelations({}, {
          labels: [createTestLabel({ id: label1 })],
        }),
      ];
      
      const results = filterByLabels(tasks, [label1, label2]);
      
      expect(results.length).toBe(1);
    });
    
    test('should return all tasks for empty label array', () => {
      const tasks = [
        createTaskWithRelations(),
        createTaskWithRelations(),
      ];
      
      const results = filterByLabels(tasks, []);
      
      expect(results.length).toBe(2);
    });
  });
  
  describe('getUniqueLabels', () => {
    test('should return unique labels from tasks', () => {
      const label1 = createTestLabel({ id: crypto.randomUUID(), name: 'Work' });
      const label2 = createTestLabel({ id: crypto.randomUUID(), name: 'Personal' });
      
      const tasks = [
        createTaskWithRelations({}, { labels: [label1] }),
        createTaskWithRelations({}, { labels: [label1, label2] }),
      ];
      
      const uniqueLabels = getUniqueLabels(tasks);
      
      expect(uniqueLabels.length).toBe(2);
    });
    
    test('should return empty array for no labels', () => {
      const tasks = [
        createTaskWithRelations(),
        createTaskWithRelations(),
      ];
      
      const uniqueLabels = getUniqueLabels(tasks);
      
      expect(uniqueLabels).toEqual([]);
    });
  });
  
  describe('getUniqueLists', () => {
    test('should return unique lists from tasks', () => {
      const list1 = createTestList({ id: crypto.randomUUID(), name: 'List 1' });
      const list2 = createTestList({ id: crypto.randomUUID(), name: 'List 2' });
      
      const tasks = [
        createTaskWithRelations({}, { list: list1 }),
        createTaskWithRelations({}, { list: list1 }),
        createTaskWithRelations({}, { list: list2 }),
      ];
      
      const uniqueLists = getUniqueLists(tasks);
      
      expect(uniqueLists.length).toBe(2);
    });
  });
});
