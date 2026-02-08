/**
 * Database Schema for Daily Task Planner
 *
 * This file contains TypeScript interfaces and Zod validation schemas
 * for all database entities.
 *
 * @requires zod - Install with: bun add zod
 */

import { z } from 'zod';

// ============================================================================
// Utility Types and Schemas
// ============================================================================

/** UUID v4 string format */
export type UUID = string;

export const uuidSchema = z.string().uuid();

/** ISO 8601 datetime string */
export type DateTimeString = string;

export const dateTimeSchema = z.string().datetime();

/** Hex color code */
export type HexColor = string;

export const hexColorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color');

// ============================================================================
// Priority Enum
// ============================================================================

export const priorityValues = ['high', 'medium', 'low', 'none'] as const;
export type Priority = (typeof priorityValues)[number];

export const prioritySchema = z.enum(priorityValues);

// ============================================================================
// Reminder Type Enum
// ============================================================================

export const reminderTypeValues = ['notification', 'email'] as const;
export type ReminderType = (typeof reminderTypeValues)[number];

export const reminderTypeSchema = z.enum(reminderTypeValues);

// ============================================================================
// List Entity
// ============================================================================

export interface List {
  id: UUID;
  name: string;
  color: HexColor;
  emoji: string | null;
  is_default: boolean;
  created_at: DateTimeString;
  updated_at: DateTimeString;
}

export const listSchema = z.object({
  id: uuidSchema,
  name: z.string().min(1, 'List name is required').max(100),
  color: hexColorSchema.default('#6366f1'),
  emoji: z.string().max(10).nullable(),
  is_default: z.boolean().default(false),
  created_at: dateTimeSchema,
  updated_at: dateTimeSchema,
});

export const createListSchema = listSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const updateListSchema = createListSchema.partial();

export type CreateListInput = z.infer<typeof createListSchema>;
export type UpdateListInput = z.infer<typeof updateListSchema>;

// ============================================================================
// Task Entity
// ============================================================================

export interface Task {
  id: UUID;
  list_id: UUID;
  name: string;
  description: string | null;
  date: DateTimeString | null;
  deadline: DateTimeString | null;
  estimate_minutes: number | null;
  actual_minutes: number | null;
  priority: Priority;
  recurring_rule: string | null;
  completed: boolean;
  completed_at: DateTimeString | null;
  deleted_at: DateTimeString | null;
  created_at: DateTimeString;
  updated_at: DateTimeString;
}

export const taskSchema = z.object({
  id: uuidSchema,
  list_id: uuidSchema,
  name: z.string().min(1, 'Task name is required').max(500),
  description: z.string().max(10000).nullable(),
  date: dateTimeSchema.nullable(),
  deadline: dateTimeSchema.nullable(),
  estimate_minutes: z.number().int().positive().max(525600).nullable(), // Max 1 year in minutes
  actual_minutes: z.number().int().nonnegative().max(525600).nullable(),
  priority: prioritySchema.default('none'),
  recurring_rule: z.string().max(1000).nullable(),
  completed: z.boolean().default(false),
  completed_at: dateTimeSchema.nullable(),
  deleted_at: dateTimeSchema.nullable(),
  created_at: dateTimeSchema,
  updated_at: dateTimeSchema,
});

export const createTaskSchema = taskSchema.omit({
  id: true,
  completed: true,
  completed_at: true,
  deleted_at: true,
  created_at: true,
  updated_at: true,
});

// For updates, we want to allow updating completed status as well
export const updateTaskSchema = taskSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
}).partial();

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

// ============================================================================
// Label Entity
// ============================================================================

export interface Label {
  id: UUID;
  name: string;
  color: HexColor;
  icon: string | null;
  created_at: DateTimeString;
}

export const labelSchema = z.object({
  id: uuidSchema,
  name: z.string().min(1, 'Label name is required').max(50),
  color: hexColorSchema.default('#8b5cf6'),
  icon: z.string().max(50).nullable(),
  created_at: dateTimeSchema,
});

export const createLabelSchema = labelSchema.omit({
  id: true,
  created_at: true,
});

export const updateLabelSchema = createLabelSchema.partial();

export type CreateLabelInput = z.infer<typeof createLabelSchema>;
export type UpdateLabelInput = z.infer<typeof updateLabelSchema>;

// ============================================================================
// Task_Label Junction Entity
// ============================================================================

export interface TaskLabel {
  task_id: UUID;
  label_id: UUID;
}

export const taskLabelSchema = z.object({
  task_id: uuidSchema,
  label_id: uuidSchema,
});

export const createTaskLabelSchema = taskLabelSchema;

export type CreateTaskLabelInput = z.infer<typeof createTaskLabelSchema>;

// ============================================================================
// Subtask Entity
// ============================================================================

export interface Subtask {
  id: UUID;
  task_id: UUID;
  name: string;
  completed: boolean;
  order: number;
  created_at: DateTimeString;
}

export const subtaskSchema = z.object({
  id: uuidSchema,
  task_id: uuidSchema,
  name: z.string().min(1, 'Subtask name is required').max(500),
  completed: z.boolean().default(false),
  order: z.number().int().nonnegative().default(0),
  created_at: dateTimeSchema,
});

export const createSubtaskSchema = subtaskSchema.omit({
  id: true,
  created_at: true,
});

export const updateSubtaskSchema = createSubtaskSchema.partial();

export type CreateSubtaskInput = z.infer<typeof createSubtaskSchema>;
export type UpdateSubtaskInput = z.infer<typeof updateSubtaskSchema>;

// ============================================================================
// Reminder Entity
// ============================================================================

export interface Reminder {
  id: UUID;
  task_id: UUID;
  remind_at: DateTimeString;
  type: ReminderType;
  sent: boolean;
  created_at: DateTimeString;
}

export const reminderSchema = z.object({
  id: uuidSchema,
  task_id: uuidSchema,
  remind_at: dateTimeSchema,
  type: reminderTypeSchema.default('notification'),
  sent: z.boolean().default(false),
  created_at: dateTimeSchema,
});

export const createReminderSchema = reminderSchema.omit({
  id: true,
  sent: true,
  created_at: true,
});

export const updateReminderSchema = createReminderSchema.partial();

export type CreateReminderInput = z.infer<typeof createReminderSchema>;
export type UpdateReminderInput = z.infer<typeof updateReminderSchema>;

// ============================================================================
// Attachment Entity
// ============================================================================

export interface Attachment {
  id: UUID;
  task_id: UUID;
  filename: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  created_at: DateTimeString;
}

export const attachmentSchema = z.object({
  id: uuidSchema,
  task_id: uuidSchema,
  filename: z.string().min(1).max(255),
  file_path: z.string().min(1).max(1000),
  file_size: z.number().int().nonnegative().max(104857600), // Max 100MB
  mime_type: z.string().min(1).max(100),
  created_at: dateTimeSchema,
});

export const createAttachmentSchema = attachmentSchema.omit({
  id: true,
  created_at: true,
});

export type CreateAttachmentInput = z.infer<typeof createAttachmentSchema>;

// ============================================================================
// Task_History Entity
// ============================================================================

export interface TaskHistory {
  id: UUID;
  task_id: UUID;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  changed_at: DateTimeString;
}

export const taskHistorySchema = z.object({
  id: uuidSchema,
  task_id: uuidSchema,
  field_name: z.string().min(1).max(100),
  old_value: z.string().max(10000).nullable(),
  new_value: z.string().max(10000).nullable(),
  changed_at: dateTimeSchema,
});

export const createTaskHistorySchema = taskHistorySchema.omit({
  id: true,
  changed_at: true,
});

export type CreateTaskHistoryInput = z.infer<typeof createTaskHistorySchema>;

// ============================================================================
// Extended Types with Relations
// ============================================================================

/** Task with its related entities */
export interface TaskWithRelations extends Task {
  list: List;
  subtasks: Subtask[];
  labels: Label[];
  reminders: Reminder[];
  attachments: Attachment[];
}

/** List with task count */
export interface ListWithTaskCount extends List {
  task_count: number;
  completed_count: number;
}

// ============================================================================
// Schema Exports
// ============================================================================

/** All entity schemas for database operations */
export const schemas = {
  list: listSchema,
  createList: createListSchema,
  updateList: updateListSchema,
  task: taskSchema,
  createTask: createTaskSchema,
  updateTask: updateTaskSchema,
  label: labelSchema,
  createLabel: createLabelSchema,
  updateLabel: updateLabelSchema,
  taskLabel: taskLabelSchema,
  createTaskLabel: createTaskLabelSchema,
  subtask: subtaskSchema,
  createSubtask: createSubtaskSchema,
  updateSubtask: updateSubtaskSchema,
  reminder: reminderSchema,
  createReminder: createReminderSchema,
  updateReminder: updateReminderSchema,
  attachment: attachmentSchema,
  createAttachment: createAttachmentSchema,
  taskHistory: taskHistorySchema,
  createTaskHistory: createTaskHistorySchema,
} as const;

/** All TypeScript type definitions */
export type SchemaTypes = {
  List: List;
  CreateListInput: CreateListInput;
  UpdateListInput: UpdateListInput;
  Task: Task;
  CreateTaskInput: CreateTaskInput;
  UpdateTaskInput: UpdateTaskInput;
  Label: Label;
  CreateLabelInput: CreateLabelInput;
  UpdateLabelInput: UpdateLabelInput;
  TaskLabel: TaskLabel;
  CreateTaskLabelInput: CreateTaskLabelInput;
  Subtask: Subtask;
  CreateSubtaskInput: CreateSubtaskInput;
  UpdateSubtaskInput: UpdateSubtaskInput;
  Reminder: Reminder;
  CreateReminderInput: CreateReminderInput;
  UpdateReminderInput: UpdateReminderInput;
  Attachment: Attachment;
  CreateAttachmentInput: CreateAttachmentInput;
  TaskHistory: TaskHistory;
  CreateTaskHistoryInput: CreateTaskHistoryInput;
  TaskWithRelations: TaskWithRelations;
  ListWithTaskCount: ListWithTaskCount;
};
