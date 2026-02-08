/**
 * Mock Database for Testing
 * 
 * Creates an in-memory SQLite database for isolated testing.
 */

import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';

let testDb: Database.Database | null = null;

// Default list ID constant
const DEFAULT_LIST_ID = '00000000-0000-0000-0000-000000000001';

/**
 * Initialize the test database schema
 */
function initializeSchema(db: Database.Database): void {
  // Lists table
  db.exec(`
    CREATE TABLE IF NOT EXISTS lists (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      color TEXT NOT NULL DEFAULT '#6366f1',
      emoji TEXT,
      is_default INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // Tasks table
  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY NOT NULL,
      list_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      date TEXT,
      deadline TEXT,
      estimate_minutes INTEGER,
      actual_minutes INTEGER,
      priority TEXT NOT NULL DEFAULT 'none',
      recurring_rule TEXT,
      completed INTEGER NOT NULL DEFAULT 0,
      completed_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE CASCADE
    );
  `);

  // Labels table
  db.exec(`
    CREATE TABLE IF NOT EXISTS labels (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL UNIQUE,
      color TEXT NOT NULL DEFAULT '#8b5cf6',
      icon TEXT,
      created_at TEXT NOT NULL
    );
  `);

  // Task_Labels junction table
  db.exec(`
    CREATE TABLE IF NOT EXISTS task_labels (
      task_id TEXT NOT NULL,
      label_id TEXT NOT NULL,
      PRIMARY KEY (task_id, label_id),
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
      FOREIGN KEY (label_id) REFERENCES labels(id) ON DELETE CASCADE
    );
  `);

  // Subtasks table
  db.exec(`
    CREATE TABLE IF NOT EXISTS subtasks (
      id TEXT PRIMARY KEY NOT NULL,
      task_id TEXT NOT NULL,
      name TEXT NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0,
      "order" INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
    );
  `);

  // Reminders table
  db.exec(`
    CREATE TABLE IF NOT EXISTS reminders (
      id TEXT PRIMARY KEY NOT NULL,
      task_id TEXT NOT NULL,
      remind_at TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'notification',
      sent INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
    );
  `);

  // Attachments table
  db.exec(`
    CREATE TABLE IF NOT EXISTS attachments (
      id TEXT PRIMARY KEY NOT NULL,
      task_id TEXT NOT NULL,
      filename TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      mime_type TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
    );
  `);

  // Task_History table
  db.exec(`
    CREATE TABLE IF NOT EXISTS task_history (
      id TEXT PRIMARY KEY NOT NULL,
      task_id TEXT NOT NULL,
      field_name TEXT NOT NULL,
      old_value TEXT,
      new_value TEXT,
      changed_at TEXT NOT NULL,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
    );
  `);

  // Create indexes
  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_tasks_list_id ON tasks(list_id)',
    'CREATE INDEX IF NOT EXISTS idx_tasks_date ON tasks(date)',
    'CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed)',
    'CREATE INDEX IF NOT EXISTS idx_tasks_deadline ON tasks(deadline)',
    'CREATE INDEX IF NOT EXISTS idx_subtasks_task_id ON subtasks(task_id)',
    'CREATE INDEX IF NOT EXISTS idx_reminders_pending ON reminders(remind_at, sent)',
    'CREATE INDEX IF NOT EXISTS idx_reminders_task_id ON reminders(task_id)',
    'CREATE INDEX IF NOT EXISTS idx_attachments_task_id ON attachments(task_id)',
    'CREATE INDEX IF NOT EXISTS idx_task_history_task_id ON task_history(task_id)',
    'CREATE INDEX IF NOT EXISTS idx_task_labels_label_id ON task_labels(label_id)',
  ];

  for (const indexSql of indexes) {
    db.exec(indexSql);
  }
}

/**
 * Seed the test database with default data
 */
function seedDefaultData(db: Database.Database): void {
  const now = new Date().toISOString();
  const inboxId = '00000000-0000-0000-0000-000000000001';
  
  db.prepare(`
    INSERT INTO lists (id, name, color, emoji, is_default, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(inboxId, 'Inbox', '#6366f1', '📥', 1, now, now);
}

/**
 * Set up the test database
 */
export function setupTestDatabase(): Database.Database {
  if (testDb) {
    return testDb;
  }
  
  // Create in-memory database
  testDb = new Database(':memory:');
  
  // Enable foreign key support
  testDb.pragma('foreign_keys = ON');
  
  // Initialize schema
  initializeSchema(testDb);
  
  // Seed default data
  seedDefaultData(testDb);
  
  return testDb;
}

/**
 * Get the test database instance
 */
export function getTestDatabase(): Database.Database {
  if (!testDb) {
    return setupTestDatabase();
  }
  return testDb;
}

/**
 * Clear all data from the test database (except default list)
 */
export function clearTestDatabase(): void {
  if (!testDb) return;
  
  testDb.exec('DELETE FROM task_history');
  testDb.exec('DELETE FROM attachments');
  testDb.exec('DELETE FROM reminders');
  testDb.exec('DELETE FROM subtasks');
  testDb.exec('DELETE FROM task_labels');
  testDb.exec('DELETE FROM labels');
  testDb.exec('DELETE FROM tasks');
  testDb.exec('DELETE FROM lists WHERE is_default = 0');
}

/**
 * Tear down the test database
 */
export function teardownTestDatabase(): void {
  if (testDb) {
    testDb.close();
    testDb = null;
  }
}

/**
 * Reset the test database (clear and re-seed)
 */
export function resetTestDatabase(): void {
  if (!testDb) {
    setupTestDatabase();
    return;
  }
  
  testDb.exec(`
    DROP TABLE IF EXISTS task_history;
    DROP TABLE IF EXISTS attachments;
    DROP TABLE IF EXISTS reminders;
    DROP TABLE IF EXISTS subtasks;
    DROP TABLE IF EXISTS task_labels;
    DROP TABLE IF EXISTS labels;
    DROP TABLE IF EXISTS tasks;
    DROP TABLE IF EXISTS lists;
  `);
  
  initializeSchema(testDb);
  seedDefaultData(testDb);
}

/**
 * Helper to generate UUIDs in tests
 */
export const testUuid = {
  generate: (): string => uuidv4(),
  list: (num: number): string => `list-${num.toString().padStart(8, '0')}-0000-0000-0000-000000000000`,
  task: (num: number): string => `task-${num.toString().padStart(8, '0')}-0000-0000-0000-000000000000`,
  label: (num: number): string => `label-${num.toString().padStart(7, '0')}-0000-0000-0000-000000000000`,
  subtask: (num: number): string => `subtask-${num.toString().padStart(5, '0')}-0000-0000-0000-000000000000`,
  reminder: (num: number): string => `reminder-${num.toString().padStart(5, '0')}-0000-0000-0000-000000000000`,
  attachment: (num: number): string => `attach-${num.toString().padStart(6, '0')}-0000-0000-0000-000000000000`,
  history: (num: number): string => `history-${num.toString().padStart(6, '0')}-0000-0000-0000-000000000000`,
};

/**
 * Helper for timestamps
 */
export const testNow = () => new Date().toISOString();

/**
 * Mock Database Interface
 * Provides a simple in-memory mock for integration tests
 */
export interface MockDatabase {
  lists: {
    create: (data: { name: string; color?: string; emoji?: string | null; isDefault?: boolean; order?: number }) => { id: string; name: string; color: string; emoji: string | null; isDefault: boolean; order: number; createdAt: string; updatedAt: string };
    findById: (id: string) => { id: string; name: string; color: string; emoji: string | null; isDefault: boolean; order: number; createdAt: string; updatedAt: string } | null;
    findMany: () => Array<{ id: string; name: string; color: string; emoji: string | null; isDefault: boolean; order: number; createdAt: string; updatedAt: string }>;
    update: (id: string, data: Partial<{ name: string; color: string; emoji: string | null; isDefault: boolean; order: number }>) => { id: string; name: string; color: string; emoji: string | null; isDefault: boolean; order: number; createdAt: string; updatedAt: string } | null;
    delete: (id: string) => void;
    getTaskCount: (listId: string, completed?: boolean) => number;
  };
  tasks: {
    create: (data: { name: string; description?: string | null; priority?: string; listId?: string; completed?: boolean; date?: string | null }) => { id: string; name: string; description: string | null; priority: string; listId: string; completed: boolean; date: string | null; createdAt: string; updatedAt: string };
    findById: (id: string) => { id: string; name: string; description: string | null; priority: string; listId: string; completed: boolean; date: string | null; createdAt: string; updatedAt: string } | null;
    findMany: (filter?: { listId?: string; completed?: boolean; priority?: string }) => Array<{ id: string; name: string; description: string | null; priority: string; listId: string; completed: boolean; date: string | null; createdAt: string; updatedAt: string }>;
    update: (id: string, data: Partial<{ name: string; description: string | null; priority: string; listId: string; completed: boolean; date: string | null }>) => { id: string; name: string; description: string | null; priority: string; listId: string; completed: boolean; date: string | null; createdAt: string; updatedAt: string } | null;
    delete: (id: string) => void;
    addLabels: (taskId: string, labelIds: string[]) => void;
    getTaskLabels: (taskId: string) => Array<{ id: string; name: string; color: string }>;
    findByLabel: (labelId: string) => Array<{ id: string; name: string }>;
  };
  labels: {
    create: (data: { name: string; color?: string; icon?: string | null }) => { id: string; name: string; color: string; icon: string | null; createdAt: string };
    findById: (id: string) => { id: string; name: string; color: string; icon: string | null; createdAt: string } | null;
    findMany: () => Array<{ id: string; name: string; color: string; icon: string | null; createdAt: string }>;
    update: (id: string, data: Partial<{ name: string; color: string; icon: string | null }>) => { id: string; name: string; color: string; icon: string | null; createdAt: string } | null;
    delete: (id: string) => void;
  };
  subtasks: {
    create: (data: { taskId: string; name: string; completed?: boolean; order?: number }) => { id: string; taskId: string; name: string; completed: boolean; order: number; createdAt: string };
    findById: (id: string) => { id: string; taskId: string; name: string; completed: boolean; order: number; createdAt: string } | null;
    findByTaskId: (taskId: string) => Array<{ id: string; taskId: string; name: string; completed: boolean; order: number; createdAt: string }>;
    update: (id: string, data: Partial<{ name: string; completed: boolean; order: number }>) => { id: string; taskId: string; name: string; completed: boolean; order: number; createdAt: string } | null;
    delete: (id: string) => void;
  };
  reminders: {
    create: (data: { taskId: string; datetime: string; type?: string; notified?: boolean }) => { id: string; taskId: string; datetime: string; type: string; notified: boolean; createdAt: string };
    findById: (id: string) => { id: string; taskId: string; datetime: string; type: string; notified: boolean; createdAt: string } | null;
    findByTaskId: (taskId: string) => Array<{ id: string; taskId: string; datetime: string; type: string; notified: boolean; createdAt: string }>;
    update: (id: string, data: Partial<{ datetime: string; type: string; notified: boolean }>) => { id: string; taskId: string; datetime: string; type: string; notified: boolean; createdAt: string } | null;
    delete: (id: string) => void;
  };
  attachments: {
    create: (data: { taskId: string; filename: string; filepath: string; mimetype: string; size: number }) => { id: string; taskId: string; filename: string; filepath: string; mimetype: string; size: number; createdAt: string };
    findById: (id: string) => { id: string; taskId: string; filename: string; filepath: string; mimetype: string; size: number; createdAt: string } | null;
    findByTaskId: (taskId: string) => Array<{ id: string; taskId: string; filename: string; filepath: string; mimetype: string; size: number; createdAt: string }>;
    delete: (id: string) => void;
  };
  history: {
    create: (data: { taskId: string; fieldName: string; oldValue?: string | null; newValue?: string | null }) => { id: string; taskId: string; fieldName: string; oldValue: string | null; newValue: string | null; changedAt: string };
    findByTaskId: (taskId: string) => Array<{ id: string; taskId: string; fieldName: string; oldValue: string | null; newValue: string | null; changedAt: string }>;
  };
  reset: () => void;
}

/**
 * Create a mock database for testing
 */
export function createMockDatabase(): MockDatabase {
  // In-memory stores
  let listsStore: Array<{
    id: string;
    name: string;
    color: string;
    emoji: string | null;
    isDefault: boolean;
    order: number;
    createdAt: string;
    updatedAt: string;
  }> = [];

  let tasksStore: Array<{
    id: string;
    name: string;
    description: string | null;
    priority: string;
    listId: string;
    completed: boolean;
    date: string | null;
    createdAt: string;
    updatedAt: string;
  }> = [];

  let labelsStore: Array<{
    id: string;
    name: string;
    color: string;
    icon: string | null;
    createdAt: string;
  }> = [];

  let subtasksStore: Array<{
    id: string;
    taskId: string;
    name: string;
    completed: boolean;
    order: number;
    createdAt: string;
  }> = [];

  let remindersStore: Array<{
    id: string;
    taskId: string;
    datetime: string;
    type: string;
    notified: boolean;
    createdAt: string;
  }> = [];

  let attachmentsStore: Array<{
    id: string;
    taskId: string;
    filename: string;
    filepath: string;
    mimetype: string;
    size: number;
    createdAt: string;
  }> = [];

  let historyStore: Array<{
    id: string;
    taskId: string;
    fieldName: string;
    oldValue: string | null;
    newValue: string | null;
    changedAt: string;
  }> = [];

  let taskLabelsStore: Array<{ taskId: string; labelId: string }> = [];

  const generateId = () => crypto.randomUUID();
  const now = () => new Date().toISOString();

  // Create default list
  const defaultList = {
    id: DEFAULT_LIST_ID,
    name: 'Inbox',
    color: '#6b7280',
    emoji: '📥',
    isDefault: true,
    order: 0,
    createdAt: now(),
    updatedAt: now(),
  };
  listsStore.push(defaultList);

  return {
    lists: {
      create: (data) => {
        const list = {
          id: generateId(),
          name: data.name,
          color: data.color || '#6366f1',
          emoji: data.emoji ?? null,
          isDefault: data.isDefault ?? false,
          order: data.order ?? listsStore.length,
          createdAt: now(),
          updatedAt: now(),
        };
        
        if (!list.name) {
          throw new Error('List name is required');
        }
        
        // Check for unique name
        if (listsStore.some(l => l.name === list.name)) {
          throw new Error(`List with name "${list.name}" already exists`);
        }
        
        listsStore.push(list);
        return list;
      },
      
      findById: (id) => listsStore.find(l => l.id === id) || null,
      
      findMany: () => [...listsStore].sort((a, b) => a.order - b.order),
      
      update: (id, data) => {
        const index = listsStore.findIndex(l => l.id === id);
        if (index === -1) return null;
        
        listsStore[index] = {
          ...listsStore[index],
          ...data,
          updatedAt: now(),
        };
        return listsStore[index];
      },
      
      delete: (id) => {
        const list = listsStore.find(l => l.id === id);
        if (!list) return;
        
        if (list.isDefault) {
          throw new Error('Cannot delete default list');
        }
        
        // Move tasks to default list
        const defaultList = listsStore.find(l => l.isDefault);
        if (defaultList) {
          tasksStore = tasksStore.map(t => 
            t.listId === id ? { ...t, listId: defaultList.id } : t
          );
        }
        
        listsStore = listsStore.filter(l => l.id !== id);
      },
      
      getTaskCount: (listId, completed) => {
        let tasks = tasksStore.filter(t => t.listId === listId);
        if (completed !== undefined) {
          tasks = tasks.filter(t => t.completed === completed);
        }
        return tasks.length;
      },
    },

    tasks: {
      create: (data) => {
        if (!data.name) {
          throw new Error('Task name is required');
        }
        
        const task = {
          id: generateId(),
          name: data.name,
          description: data.description ?? null,
          priority: data.priority || 'none',
          listId: data.listId || DEFAULT_LIST_ID,
          completed: data.completed ?? false,
          date: data.date ?? null,
          createdAt: now(),
          updatedAt: now(),
        };
        
        tasksStore.push(task);
        return task;
      },
      
      findById: (id) => tasksStore.find(t => t.id === id) || null,
      
      findMany: (filter = {}) => {
        let tasks = [...tasksStore];
        
        if (filter.listId !== undefined) {
          tasks = tasks.filter(t => t.listId === filter.listId);
        }
        if (filter.completed !== undefined) {
          tasks = tasks.filter(t => t.completed === filter.completed);
        }
        if (filter.priority !== undefined) {
          tasks = tasks.filter(t => t.priority === filter.priority);
        }
        
        return tasks;
      },
      
      update: (id, data) => {
        const index = tasksStore.findIndex(t => t.id === id);
        if (index === -1) return null;
        
        const oldTask = tasksStore[index];
        
        // Record history for changed fields
        Object.keys(data).forEach(field => {
          const fieldName = field;
          const oldValue = oldTask[field as keyof typeof oldTask];
          const newValue = data[field as keyof typeof data];
          
          if (oldValue !== newValue) {
            historyStore.push({
              id: generateId(),
              taskId: id,
              fieldName,
              oldValue: String(oldValue ?? ''),
              newValue: String(newValue ?? ''),
              changedAt: now(),
            });
          }
        });
        
        tasksStore[index] = {
          ...tasksStore[index],
          ...data,
          updatedAt: now(),
        };
        return tasksStore[index];
      },
      
      delete: (id) => {
        tasksStore = tasksStore.filter(t => t.id !== id);
        subtasksStore = subtasksStore.filter(s => s.taskId !== id);
        remindersStore = remindersStore.filter(r => r.taskId !== id);
        attachmentsStore = attachmentsStore.filter(a => a.taskId !== id);
        taskLabelsStore = taskLabelsStore.filter(tl => tl.taskId !== id);
      },
      
      addLabels: (taskId, labelIds) => {
        labelIds.forEach(labelId => {
          if (!taskLabelsStore.some(tl => tl.taskId === taskId && tl.labelId === labelId)) {
            taskLabelsStore.push({ taskId, labelId });
          }
        });
      },
      
      getTaskLabels: (taskId) => {
        const labelIds = taskLabelsStore
          .filter(tl => tl.taskId === taskId)
          .map(tl => tl.labelId);
        
        return labelsStore
          .filter(l => labelIds.includes(l.id))
          .map(l => ({ id: l.id, name: l.name, color: l.color }));
      },
      
      findByLabel: (labelId) => {
        const taskIds = taskLabelsStore
          .filter(tl => tl.labelId === labelId)
          .map(tl => tl.taskId);
        
        return tasksStore
          .filter(t => taskIds.includes(t.id))
          .map(t => ({ id: t.id, name: t.name }));
      },
    },

    labels: {
      create: (data) => {
        const label = {
          id: generateId(),
          name: data.name,
          color: data.color || '#8b5cf6',
          icon: data.icon ?? null,
          createdAt: now(),
        };
        labelsStore.push(label);
        return label;
      },
      
      findById: (id) => labelsStore.find(l => l.id === id) || null,
      
      findMany: () => [...labelsStore],
      
      update: (id, data) => {
        const index = labelsStore.findIndex(l => l.id === id);
        if (index === -1) return null;
        
        labelsStore[index] = {
          ...labelsStore[index],
          ...data,
        };
        return labelsStore[index];
      },
      
      delete: (id) => {
        labelsStore = labelsStore.filter(l => l.id !== id);
        taskLabelsStore = taskLabelsStore.filter(tl => tl.labelId !== id);
      },
    },

    subtasks: {
      create: (data) => {
        const subtask = {
          id: generateId(),
          taskId: data.taskId,
          name: data.name,
          completed: data.completed ?? false,
          order: data.order ?? 0,
          createdAt: now(),
        };
        subtasksStore.push(subtask);
        return subtask;
      },
      
      findById: (id) => subtasksStore.find(s => s.id === id) || null,
      
      findByTaskId: (taskId) => subtasksStore
        .filter(s => s.taskId === taskId)
        .sort((a, b) => a.order - b.order),
      
      update: (id, data) => {
        const index = subtasksStore.findIndex(s => s.id === id);
        if (index === -1) return null;
        
        subtasksStore[index] = {
          ...subtasksStore[index],
          ...data,
        };
        return subtasksStore[index];
      },
      
      delete: (id) => {
        subtasksStore = subtasksStore.filter(s => s.id !== id);
      },
    },

    reminders: {
      create: (data) => {
        const reminder = {
          id: generateId(),
          taskId: data.taskId,
          datetime: data.datetime,
          type: data.type || 'notification',
          notified: data.notified ?? false,
          createdAt: now(),
        };
        remindersStore.push(reminder);
        return reminder;
      },
      
      findById: (id) => remindersStore.find(r => r.id === id) || null,
      
      findByTaskId: (taskId) => remindersStore.filter(r => r.taskId === taskId),
      
      update: (id, data) => {
        const index = remindersStore.findIndex(r => r.id === id);
        if (index === -1) return null;
        
        remindersStore[index] = {
          ...remindersStore[index],
          ...data,
        };
        return remindersStore[index];
      },
      
      delete: (id) => {
        remindersStore = remindersStore.filter(r => r.id !== id);
      },
    },

    attachments: {
      create: (data) => {
        const attachment = {
          id: generateId(),
          taskId: data.taskId,
          filename: data.filename,
          filepath: data.filepath,
          mimetype: data.mimetype,
          size: data.size,
          createdAt: now(),
        };
        attachmentsStore.push(attachment);
        return attachment;
      },
      
      findById: (id) => attachmentsStore.find(a => a.id === id) || null,
      
      findByTaskId: (taskId) => attachmentsStore.filter(a => a.taskId === taskId),
      
      delete: (id) => {
        attachmentsStore = attachmentsStore.filter(a => a.id !== id);
      },
    },

    history: {
      create: (data) => {
        const entry = {
          id: generateId(),
          taskId: data.taskId,
          fieldName: data.fieldName,
          oldValue: data.oldValue ?? null,
          newValue: data.newValue ?? null,
          changedAt: now(),
        };
        historyStore.push(entry);
        return entry;
      },
      
      findByTaskId: (taskId) => historyStore
        .filter(h => h.taskId === taskId)
        .sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime()),
    },

    reset: () => {
      listsStore = [];
      tasksStore = [];
      labelsStore = [];
      subtasksStore = [];
      remindersStore = [];
      attachmentsStore = [];
      historyStore = [];
      taskLabelsStore = [];
      
      // Re-create default list
      listsStore.push({
        id: DEFAULT_LIST_ID,
        name: 'Inbox',
        color: '#6b7280',
        emoji: '📥',
        isDefault: true,
        order: 0,
        createdAt: now(),
        updatedAt: now(),
      });
    },
  };
}
