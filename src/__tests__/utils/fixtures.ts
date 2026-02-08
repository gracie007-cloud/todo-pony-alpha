/**
 * Test Fixtures
 * 
 * Reusable test data for all tests.
 */

import type { 
  List, 
  Task, 
  Label, 
  Subtask, 
  Reminder, 
  Attachment, 
  TaskHistory,
  TaskWithRelations,
  ListWithTaskCount,
  Priority
} from '@/lib/db/schema';

// Default list ID (matches mock-db default)
export const DEFAULT_LIST_ID = '00000000-0000-0000-0000-000000000001';

// Sample dates
export const testDates = {
  now: new Date().toISOString(),
  today: new Date().toISOString().split('T')[0] + 'T00:00:00.000Z',
  yesterday: new Date(Date.now() - 86400000).toISOString().split('T')[0] + 'T00:00:00.000Z',
  tomorrow: new Date(Date.now() + 86400000).toISOString().split('T')[0] + 'T00:00:00.000Z',
  nextWeek: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0] + 'T00:00:00.000Z',
  lastWeek: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0] + 'T00:00:00.000Z',
  nextMonth: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0] + 'T00:00:00.000Z',
};

/**
 * Create a sample list
 */
export function createTestList(overrides: Partial<List> = {}): List {
  const id = overrides.id || crypto.randomUUID();
  const now = testDates.now;
  
  return {
    id,
    name: 'Test List',
    color: '#6366f1',
    emoji: '📋',
    is_default: false,
    created_at: now,
    updated_at: now,
    ...overrides,
  };
}

/**
 * Create a sample task
 */
export function createTestTask(overrides: Partial<Task> = {}): Task {
  const id = overrides.id || crypto.randomUUID();
  const now = testDates.now;
  
  return {
    id,
    list_id: DEFAULT_LIST_ID,
    name: 'Test Task',
    description: null,
    date: null,
    deadline: null,
    estimate_minutes: null,
    actual_minutes: null,
    priority: 'none' as Priority,
    recurring_rule: null,
    completed: false,
    completed_at: null,
    created_at: now,
    updated_at: now,
    ...overrides,
  };
}

/**
 * Create a sample label
 */
export function createTestLabel(overrides: Partial<Label> = {}): Label {
  const id = overrides.id || crypto.randomUUID();
  const now = testDates.now;
  
  return {
    id,
    name: 'Test Label',
    color: '#8b5cf6',
    icon: null,
    created_at: now,
    ...overrides,
  };
}

/**
 * Create a sample subtask
 */
export function createTestSubtask(overrides: Partial<Subtask> = {}): Subtask {
  const id = overrides.id || crypto.randomUUID();
  const now = testDates.now;
  
  return {
    id,
    task_id: '',
    name: 'Test Subtask',
    completed: false,
    order: 0,
    created_at: now,
    ...overrides,
  };
}

/**
 * Create a sample reminder
 */
export function createTestReminder(overrides: Partial<Reminder> = {}): Reminder {
  const id = overrides.id || crypto.randomUUID();
  const now = testDates.now;
  
  return {
    id,
    task_id: '',
    remind_at: testDates.tomorrow,
    type: 'notification',
    sent: false,
    created_at: now,
    ...overrides,
  };
}

/**
 * Create a sample attachment
 */
export function createTestAttachment(overrides: Partial<Attachment> = {}): Attachment {
  const id = overrides.id || crypto.randomUUID();
  const now = testDates.now;
  
  return {
    id,
    task_id: '',
    filename: 'test-file.pdf',
    file_path: '/uploads/test-file.pdf',
    file_size: 1024,
    mime_type: 'application/pdf',
    created_at: now,
    ...overrides,
  };
}

/**
 * Create a sample task history entry
 */
export function createTestHistory(overrides: Partial<TaskHistory> = {}): TaskHistory {
  const id = overrides.id || crypto.randomUUID();
  const now = testDates.now;
  
  return {
    id,
    task_id: '',
    field_name: 'name',
    old_value: null,
    new_value: null,
    changed_at: now,
    ...overrides,
  };
}

/**
 * Create a task with relations
 */
export function createTestTaskWithRelations(
  taskOverrides: Partial<Task> = {},
  relations: {
    list?: List;
    subtasks?: Subtask[];
    labels?: Label[];
    reminders?: Reminder[];
    attachments?: Attachment[];
  } = {}
): TaskWithRelations {
  const task = createTestTask(taskOverrides);
  
  return {
    ...task,
    list: relations.list || createTestList({ id: task.list_id }),
    subtasks: relations.subtasks || [],
    labels: relations.labels || [],
    reminders: relations.reminders || [],
    attachments: relations.attachments || [],
  };
}

/**
 * Create a list with task counts
 */
export function createTestListWithTaskCounts(
  overrides: Partial<List> = {},
  counts: { task_count?: number; completed_count?: number } = {}
): ListWithTaskCount {
  const list = createTestList(overrides);
  
  return {
    ...list,
    task_count: counts.task_count ?? 0,
    completed_count: counts.completed_count ?? 0,
  };
}

/**
 * Create multiple test lists
 */
export function createTestLists(count: number): List[] {
  return Array.from({ length: count }, (_, i) => 
    createTestList({
      id: crypto.randomUUID(),
      name: `List ${i + 1}`,
      color: `#${((i * 50) % 256).toString(16).padStart(2, '0')}66f1`,
    })
  );
}

/**
 * Create multiple test tasks
 */
export function createTestTasks(count: number, listId?: string): Task[] {
  return Array.from({ length: count }, (_, i) => 
    createTestTask({
      id: crypto.randomUUID(),
      list_id: listId || DEFAULT_LIST_ID,
      name: `Task ${i + 1}`,
      priority: (['high', 'medium', 'low', 'none'] as Priority[])[i % 4],
    })
  );
}

/**
 * Create multiple test labels
 */
export function createTestLabels(count: number): Label[] {
  const colors = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#8b5cf6'];
  
  return Array.from({ length: count }, (_, i) => 
    createTestLabel({
      id: crypto.randomUUID(),
      name: `Label ${i + 1}`,
      color: colors[i % colors.length],
    })
  );
}

/**
 * Create a set of tasks with various states for testing
 */
export function createTestTaskSet(): {
  incomplete: Task;
  completed: Task;
  overdue: Task;
  dueToday: Task;
  dueTomorrow: Task;
  highPriority: Task;
  lowPriority: Task;
} {
  return {
    incomplete: createTestTask({ name: 'Incomplete Task' }),
    completed: createTestTask({ 
      name: 'Completed Task', 
      completed: true, 
      completed_at: testDates.now 
    }),
    overdue: createTestTask({ 
      name: 'Overdue Task', 
      deadline: testDates.lastWeek 
    }),
    dueToday: createTestTask({ 
      name: 'Due Today', 
      date: testDates.today 
    }),
    dueTomorrow: createTestTask({ 
      name: 'Due Tomorrow', 
      date: testDates.tomorrow 
    }),
    highPriority: createTestTask({ 
      name: 'High Priority', 
      priority: 'high' 
    }),
    lowPriority: createTestTask({ 
      name: 'Low Priority', 
      priority: 'low' 
    }),
  };
}

/**
 * Mock API response helpers
 */
export const mockApiResponses = {
  success: <T>(data: T) => ({ 
    success: true, 
    data 
  }),
  error: (message: string, status: number = 400) => ({ 
    success: false, 
    error: message,
    status 
  }),
  notFound: () => ({ 
    success: false, 
    error: 'Not found',
    status: 404 
  }),
};

/**
 * Test fixtures container type
 */
export interface TestFixtures {
  lists: List[];
  tasks: Task[];
  labels: Label[];
  subtasks: Subtask[];
  reminders: Reminder[];
  attachments: Attachment[];
  history: TaskHistory[];
}

/**
 * Create a complete set of test fixtures
 */
export function createTestFixtures(): TestFixtures {
  const defaultList = createTestList({
    id: DEFAULT_LIST_ID,
    name: 'Inbox',
    color: '#6b7280',
    emoji: '📥',
    is_default: true,
  });

  const workList = createTestList({
    name: 'Work',
    color: '#3b82f6',
    emoji: '💼',
  });

  const personalList = createTestList({
    name: 'Personal',
    color: '#22c55e',
    emoji: '🏠',
  });

  const urgentLabel = createTestLabel({
    name: 'Urgent',
    color: '#ef4444',
  });

  const importantLabel = createTestLabel({
    name: 'Important',
    color: '#f97316',
  });

  const task1 = createTestTask({
    list_id: workList.id,
    name: 'Complete project proposal',
    description: 'Write the Q1 project proposal document',
    priority: 'high',
    date: testDates.tomorrow,
  });

  const task2 = createTestTask({
    list_id: workList.id,
    name: 'Review code changes',
    description: 'Review pull requests from team members',
    priority: 'medium',
    completed: true,
    completed_at: testDates.now,
  });

  const task3 = createTestTask({
    list_id: personalList.id,
    name: 'Buy groceries',
    description: 'Get milk, eggs, and bread',
    priority: 'low',
    date: testDates.today,
  });

  const subtask1 = createTestSubtask({
    task_id: task1.id,
    name: 'Research requirements',
    completed: true,
    order: 0,
  });

  const subtask2 = createTestSubtask({
    task_id: task1.id,
    name: 'Write draft',
    completed: false,
    order: 1,
  });

  const reminder1 = createTestReminder({
    task_id: task1.id,
    remind_at: testDates.tomorrow,
    type: 'notification',
  });

  const attachment1 = createTestAttachment({
    task_id: task1.id,
    filename: 'proposal.pdf',
    file_path: '/uploads/proposal.pdf',
    file_size: 2048,
    mime_type: 'application/pdf',
  });

  const history1 = createTestHistory({
    task_id: task1.id,
    field_name: 'priority',
    old_value: 'medium',
    new_value: 'high',
  });

  return {
    lists: [defaultList, workList, personalList],
    tasks: [task1, task2, task3],
    labels: [urgentLabel, importantLabel],
    subtasks: [subtask1, subtask2],
    reminders: [reminder1],
    attachments: [attachment1],
    history: [history1],
  };
}
