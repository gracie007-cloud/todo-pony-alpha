/**
 * Database Connection and Initialization
 *
 * This module provides the SQLite database connection using better-sqlite3
 * and handles schema initialization and seeding.
 */

import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';

// Database file path - stored in the project root
const DB_PATH = path.join(process.cwd(), 'data', 'tasks.db');

// Singleton database instance
let db: Database.Database | null = null;

/**
 * Get the database instance, creating it if necessary
 */
export function getDatabase(): Database.Database {
  if (!db) {
    // Ensure data directory exists
    const dataDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    db = new Database(DB_PATH);
    
    // Enable foreign key support
    db.pragma('foreign_keys = ON');
    
    // Initialize schema
    initializeSchema(db);
    
    // Seed default data
    seedDatabase(db);
  }
  
  return db;
}

/**
 * Initialize database schema with all tables and indexes
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
      deleted_at TEXT,
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
    'CREATE INDEX IF NOT EXISTS idx_tasks_date_completed ON tasks(date, completed)',
    'CREATE INDEX IF NOT EXISTS idx_tasks_list_completed ON tasks(list_id, completed)',
    'CREATE INDEX IF NOT EXISTS idx_subtasks_task_id ON subtasks(task_id)',
    'CREATE INDEX IF NOT EXISTS idx_reminders_pending ON reminders(remind_at, sent)',
    'CREATE INDEX IF NOT EXISTS idx_reminders_task_id ON reminders(task_id)',
    'CREATE INDEX IF NOT EXISTS idx_attachments_task_id ON attachments(task_id)',
    'CREATE INDEX IF NOT EXISTS idx_task_history_task_id ON task_history(task_id)',
    'CREATE INDEX IF NOT EXISTS idx_task_history_changed_at ON task_history(changed_at)',
    'CREATE INDEX IF NOT EXISTS idx_task_labels_label_id ON task_labels(label_id)',
  ];

  for (const indexSql of indexes) {
    db.exec(indexSql);
  }
}

/**
 * Seed the database with default data
 */
function seedDatabase(db: Database.Database): void {
  // Check if default list already exists
  const existingDefault = db.prepare('SELECT id FROM lists WHERE is_default = 1').get() as { id: string } | undefined;
  
  if (!existingDefault) {
    const now = new Date().toISOString();
    const inboxId = uuidv4();
    
    db.prepare(`
      INSERT INTO lists (id, name, color, emoji, is_default, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(inboxId, 'Inbox', '#6366f1', '📥', 1, now, now);
    
    console.log('Created default Inbox list with ID:', inboxId);
  }
}

/**
 * Close the database connection
 */
export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}

/**
 * Reset the database (for testing/development)
 */
export function resetDatabase(): void {
  const database = getDatabase();
  
  database.exec(`
    DROP TABLE IF EXISTS task_history;
    DROP TABLE IF EXISTS attachments;
    DROP TABLE IF EXISTS reminders;
    DROP TABLE IF EXISTS subtasks;
    DROP TABLE IF EXISTS task_labels;
    DROP TABLE IF EXISTS labels;
    DROP TABLE IF EXISTS tasks;
    DROP TABLE IF EXISTS lists;
  `);
  
  // Re-initialize
  initializeSchema(database);
  seedDatabase(database);
}

// Export utilities
export { uuidv4 };
export const now = () => new Date().toISOString();

// Re-export types and schemas
export * from './schema';
