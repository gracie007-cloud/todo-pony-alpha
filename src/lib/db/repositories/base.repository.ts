/**
 * Base Repository
 *
 * Provides common CRUD operations for all repositories.
 * Uses prepared statements for security and performance.
 */

import Database from 'better-sqlite3';
import { getDatabase, uuidv4, now } from '../index';

/**
 * Allowed table names for SQL interpolation
 * This prevents SQL injection via table name parameters
 */
const ALLOWED_TABLES = [
  'lists',
  'tasks',
  'labels',
  'task_labels',
  'subtasks',
  'reminders',
  'attachments',
  'task_history',
] as const;

type AllowedTable = typeof ALLOWED_TABLES[number];

/**
 * Validates that a table name is in the allowlist
 */
function validateTableName(tableName: string): asserts tableName is AllowedTable {
  if (!ALLOWED_TABLES.includes(tableName as AllowedTable)) {
    throw new Error(`Invalid table name: ${tableName}. Table must be one of: ${ALLOWED_TABLES.join(', ')}`);
  }
}

/**
 * Base repository class with common database operations
 */
export abstract class BaseRepository<T, CreateInput, UpdateInput> {
  protected db: Database.Database;
  protected tableName: string;
  protected idColumn: string;

  constructor(tableName: string, idColumn: string = 'id') {
    // Validate table name against allowlist for security
    validateTableName(tableName);
    this.tableName = tableName;
    this.idColumn = idColumn;
    this.db = getDatabase();
  }

  /**
   * Get the database instance (may be refreshed if needed)
   */
  protected getDb(): Database.Database {
    this.db = getDatabase();
    return this.db;
  }

  /**
   * Find all records in the table
   */
  findAll(): T[] {
    const sql = `SELECT * FROM ${this.tableName}`;
    return this.getDb().prepare(sql).all() as T[];
  }

  /**
   * Find a single record by ID
   */
  findById(id: string): T | undefined {
    const sql = `SELECT * FROM ${this.tableName} WHERE ${this.idColumn} = ?`;
    return this.getDb().prepare(sql).get(id) as T | undefined;
  }

  /**
   * Find records by a specific column value
   */
  findBy(column: string, value: unknown): T[] {
    const sql = `SELECT * FROM ${this.tableName} WHERE ${column} = ?`;
    return this.getDb().prepare(sql).all(value) as T[];
  }

  /**
   * Find a single record by a specific column value
   */
  findOneBy(column: string, value: unknown): T | undefined {
    const sql = `SELECT * FROM ${this.tableName} WHERE ${column} = ? LIMIT 1`;
    return this.getDb().prepare(sql).get(value) as T | undefined;
  }

  /**
   * Create a new record - to be implemented by child classes
   */
  abstract create(data: CreateInput): T;

  /**
   * Update a record - to be implemented by child classes
   */
  abstract update(id: string, data: UpdateInput): T | undefined;

  /**
   * Delete a record by ID
   */
  delete(id: string): boolean {
    const sql = `DELETE FROM ${this.tableName} WHERE ${this.idColumn} = ?`;
    const result = this.getDb().prepare(sql).run(id);
    return result.changes > 0;
  }

  /**
   * Check if a record exists
   */
  exists(id: string): boolean {
    const sql = `SELECT 1 FROM ${this.tableName} WHERE ${this.idColumn} = ? LIMIT 1`;
    const result = this.getDb().prepare(sql).get(id);
    return result !== undefined;
  }

  /**
   * Count all records
   */
  count(): number {
    const sql = `SELECT COUNT(*) as count FROM ${this.tableName}`;
    const result = this.getDb().prepare(sql).get() as { count: number };
    return result.count;
  }

  /**
   * Count records by a specific column value
   */
  countBy(column: string, value: unknown): number {
    const sql = `SELECT COUNT(*) as count FROM ${this.tableName} WHERE ${column} = ?`;
    const result = this.getDb().prepare(sql).get(value) as { count: number };
    return result.count;
  }

  /**
   * Generate a new UUID
   */
  protected generateId(): string {
    return uuidv4();
  }

  /**
   * Get current timestamp in ISO format
   */
  protected timestamp(): string {
    return now();
  }

  /**
   * Execute a raw SQL query
   */
  protected query(sql: string, ...params: unknown[]): Database.RunResult {
    return this.getDb().prepare(sql).run(...params);
  }

  /**
   * Execute a raw SQL query and return all results
   */
  protected queryAll<T>(sql: string, ...params: unknown[]): T[] {
    return this.getDb().prepare(sql).all(...params) as T[];
  }

  /**
   * Execute a raw SQL query and return a single result
   */
  protected queryOne<T>(sql: string, ...params: unknown[]): T | undefined {
    return this.getDb().prepare(sql).get(...params) as T | undefined;
  }

  /**
   * Begin a transaction
   */
  protected transaction<R>(fn: () => R): R {
    return this.getDb().transaction(fn)();
  }
}

/**
 * Helper type for repositories with composite primary keys
 */
export abstract class CompositeKeyRepository<T, CreateInput> {
  protected db: Database.Database;
  protected tableName: string;

  constructor(tableName: string) {
    this.tableName = tableName;
    this.db = getDatabase();
  }

  protected getDb(): Database.Database {
    this.db = getDatabase();
    return this.db;
  }

  /**
   * Create a new record - to be implemented by child classes
   */
  abstract create(data: CreateInput): T;

  /**
   * Delete a record by composite key - to be implemented by child classes
   */
  abstract delete(...ids: string[]): boolean;

  /**
   * Generate a new UUID
   */
  protected generateId(): string {
    return uuidv4();
  }

  /**
   * Get current timestamp in ISO format
   */
  protected timestamp(): string {
    return now();
  }

  /**
   * Execute a raw SQL query
   */
  protected query(sql: string, ...params: unknown[]): Database.RunResult {
    return this.getDb().prepare(sql).run(...params);
  }

  /**
   * Execute a raw SQL query and return all results
   */
  protected queryAll<T>(sql: string, ...params: unknown[]): T[] {
    return this.getDb().prepare(sql).all(...params) as T[];
  }

  /**
   * Execute a raw SQL query and return a single result
   */
  protected queryOne<T>(sql: string, ...params: unknown[]): T | undefined {
    return this.getDb().prepare(sql).get(...params) as T | undefined;
  }
}
