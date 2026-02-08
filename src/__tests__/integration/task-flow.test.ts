/**
 * Integration tests for Task flow
 * Tests the complete lifecycle: create, edit, complete, delete task
 */

import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { createMockDatabase, type MockDatabase } from "../utils/mock-db";

describe("Task Flow Integration", () => {
  let db: MockDatabase;

  beforeEach(() => {
    db = createMockDatabase();
  });

  afterEach(() => {
    db.reset();
  });

  describe("Complete Task Lifecycle", () => {
    test("should create, retrieve, update, and delete a task", async () => {
      // Step 1: Create a list first
      const list = db.lists.create({
        name: "Work Tasks",
        color: "#3b82f6",
        emoji: "💼",
        isDefault: false,
      });
      
      expect(list.id).toBeDefined();
      expect(list.name).toBe("Work Tasks");

      // Step 2: Create a task in the list
      const task = db.tasks.create({
        name: "Complete project proposal",
        description: "Write the Q1 project proposal document",
        priority: "high",
        listId: list.id,
        completed: false,
        date: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      });
      
      expect(task.id).toBeDefined();
      expect(task.name).toBe("Complete project proposal");
      expect(task.priority).toBe("high");

      // Step 3: Retrieve the task
      const retrievedTask = db.tasks.findById(task.id);
      expect(retrievedTask).not.toBeNull();
      expect(retrievedTask?.name).toBe("Complete project proposal");

      // Step 4: Update the task
      const updatedTask = db.tasks.update(task.id, {
        name: "Complete Q1 project proposal",
        description: "Updated: Write the detailed Q1 project proposal document",
      });
      
      expect(updatedTask).not.toBeNull();
      expect(updatedTask?.name).toBe("Complete Q1 project proposal");

      // Step 5: Mark task as completed
      const completedTask = db.tasks.update(task.id, {
        completed: true,
      });
      
      expect(completedTask?.completed).toBe(true);

      // Step 6: Delete the task
      db.tasks.delete(task.id);
      
      const deletedTask = db.tasks.findById(task.id);
      expect(deletedTask).toBeNull();
    });

    test("should handle task with all related entities", async () => {
      // Create prerequisites
      const list = db.lists.create({
        name: "Personal",
        color: "#22c55e",
        emoji: "🏠",
        isDefault: false,
      });

      const label1 = db.labels.create({
        name: "Important",
        color: "#ef4444",
      });

      const label2 = db.labels.create({
        name: "Urgent",
        color: "#f97316",
      });

      // Create task
      const task = db.tasks.create({
        name: "Plan vacation",
        description: "Research and book summer vacation",
        priority: "medium",
        listId: list.id,
        completed: false,
      });

      // Add subtasks
      const subtask1 = db.subtasks.create({
        taskId: task.id,
        name: "Research destinations",
        completed: false,
        order: 0,
      });

      const subtask2 = db.subtasks.create({
        taskId: task.id,
        name: "Book flights",
        completed: false,
        order: 1,
      });

      // Add labels
      db.tasks.addLabels(task.id, [label1.id, label2.id]);

      // Add reminder
      db.reminders.create({
        taskId: task.id,
        datetime: new Date(Date.now() + 86400000).toISOString(),
        notified: false,
      });

      // Verify all relations
      const taskWithRelations = db.tasks.findById(task.id);
      expect(taskWithRelations).not.toBeNull();

      const subtasks = db.subtasks.findByTaskId(task.id);
      expect(subtasks).toHaveLength(2);

      const reminders = db.reminders.findByTaskId(task.id);
      expect(reminders).toHaveLength(1);

      const taskLabels = db.tasks.getTaskLabels(task.id);
      expect(taskLabels).toHaveLength(2);

      // Complete subtasks
      db.subtasks.update(subtask1.id, { completed: true });
      
      const updatedSubtasks = db.subtasks.findByTaskId(task.id);
      const completedCount = updatedSubtasks.filter(s => s.completed).length;
      expect(completedCount).toBe(1);

      // Complete all subtasks and main task
      db.subtasks.update(subtask2.id, { completed: true });
      db.tasks.update(task.id, { completed: true });

      // Verify completion
      const finalTask = db.tasks.findById(task.id);
      expect(finalTask?.completed).toBe(true);
    });
  });

  describe("Task Filtering Flow", () => {
    beforeEach(() => {
      // Create test data
      const list = db.lists.create({
        name: "Test List",
        color: "#3b82f6",
        isDefault: false,
      });

      // Create tasks with different states
      db.tasks.create({
        name: "Completed Task 1",
        listId: list.id,
        completed: true,
        priority: "low",
      });

      db.tasks.create({
        name: "Completed Task 2",
        listId: list.id,
        completed: true,
        priority: "none",
      });

      db.tasks.create({
        name: "Pending High Priority",
        listId: list.id,
        completed: false,
        priority: "high",
        date: new Date(Date.now() + 86400000).toISOString(),
      });

      db.tasks.create({
        name: "Overdue Task",
        listId: list.id,
        completed: false,
        priority: "high",
        date: new Date(Date.now() - 86400000).toISOString(),
      });

      db.tasks.create({
        name: "Pending Low Priority",
        listId: list.id,
        completed: false,
        priority: "low",
      });
    });

    test("should filter tasks by completion status", () => {
      const allTasks = db.tasks.findMany();
      const completedTasks = db.tasks.findMany({ completed: true });
      const pendingTasks = db.tasks.findMany({ completed: false });

      expect(allTasks.length).toBe(5);
      expect(completedTasks.length).toBe(2);
      expect(pendingTasks.length).toBe(3);
    });

    test("should filter tasks by priority", () => {
      const highPriority = db.tasks.findMany({ priority: "high" });
      const lowPriority = db.tasks.findMany({ priority: "low" });

      expect(highPriority.length).toBe(2);
      expect(lowPriority.length).toBe(2);
    });

    test("should filter tasks by list", () => {
      const list = db.lists.findMany()[0];
      const tasksInList = db.tasks.findMany({ listId: list.id });

      expect(tasksInList.length).toBe(5);
    });

    test("should identify overdue tasks", () => {
      const allTasks = db.tasks.findMany();
      const overdueTasks = allTasks.filter(task => {
        if (!task.date || task.completed) return false;
        return new Date(task.date) < new Date();
      });

      expect(overdueTasks.length).toBe(1);
      expect(overdueTasks[0].name).toBe("Overdue Task");
    });
  });

  describe("Task History Flow", () => {
    test("should track task changes", () => {
      const task = db.tasks.create({
        name: "Original Name",
        priority: "low",
        completed: false,
      });

      // Make several changes
      db.tasks.update(task.id, { name: "Updated Name" });
      db.tasks.update(task.id, { priority: "high" });
      db.tasks.update(task.id, { completed: true });

      // Verify history was recorded
      const history = db.history.findByTaskId(task.id);
      expect(history.length).toBeGreaterThan(0);
    });
  });

  describe("Task with Attachments Flow", () => {
    test("should manage task attachments", () => {
      const task = db.tasks.create({
        name: "Task with files",
      });

      // Add attachments
      const attachment1 = db.attachments.create({
        taskId: task.id,
        filename: "document.pdf",
        filepath: "/uploads/document.pdf",
        mimetype: "application/pdf",
        size: 1024,
      });

      db.attachments.create({
        taskId: task.id,
        filename: "image.png",
        filepath: "/uploads/image.png",
        mimetype: "image/png",
        size: 2048,
      });

      // Verify attachments
      const attachments = db.attachments.findByTaskId(task.id);
      expect(attachments).toHaveLength(2);

      // Delete one attachment
      db.attachments.delete(attachment1.id);
      
      const remainingAttachments = db.attachments.findByTaskId(task.id);
      expect(remainingAttachments).toHaveLength(1);
      expect(remainingAttachments[0].filename).toBe("image.png");

      // Delete task should handle orphaned attachments
      db.tasks.delete(task.id);
      
      // Attachments should still exist (cascade depends on implementation)
      const taskAttachments = db.attachments.findByTaskId(task.id);
      expect(taskAttachments).toHaveLength(1);
    });
  });

  describe("Bulk Operations Flow", () => {
    test("should handle bulk task creation", () => {
      const list = db.lists.create({ name: "Bulk List" });
      
      const taskNames = ["Task 1", "Task 2", "Task 3", "Task 4", "Task 5"];
      
      taskNames.forEach((name, index) => {
        db.tasks.create({
          name,
          listId: list.id,
          priority: index < 2 ? "high" : "low",
        });
      });

      const allTasks = db.tasks.findMany({ listId: list.id });
      expect(allTasks).toHaveLength(5);

      const highPriorityTasks = db.tasks.findMany({ 
        listId: list.id, 
        priority: "high" 
      });
      expect(highPriorityTasks).toHaveLength(2);
    });

    test("should handle bulk completion", () => {
      const list = db.lists.create({ name: "Bulk Complete" });
      
      // Create 5 tasks
      for (let i = 1; i <= 5; i++) {
        db.tasks.create({
          name: `Task ${i}`,
          listId: list.id,
        });
      }

      // Complete all tasks
      const tasks = db.tasks.findMany({ listId: list.id });
      tasks.forEach(task => {
        db.tasks.update(task.id, { completed: true });
      });

      // Verify all completed
      const completedTasks = db.tasks.findMany({ 
        listId: list.id, 
        completed: true 
      });
      expect(completedTasks).toHaveLength(5);
    });

    test("should handle bulk deletion", () => {
      const list = db.lists.create({ name: "Bulk Delete" });
      
      // Create tasks
      for (let i = 1; i <= 5; i++) {
        db.tasks.create({
          name: `Task ${i}`,
          listId: list.id,
        });
      }

      // Delete all tasks
      const tasks = db.tasks.findMany({ listId: list.id });
      tasks.forEach(task => {
        db.tasks.delete(task.id);
      });

      // Verify all deleted
      const remainingTasks = db.tasks.findMany({ listId: list.id });
      expect(remainingTasks).toHaveLength(0);
    });
  });

  describe("Task Validation Flow", () => {
    test("should enforce required fields", () => {
      // Should fail without name
      expect(() => {
        db.tasks.create({ name: "" });
      }).toThrow();

      // Should succeed with name
      expect(() => {
        db.tasks.create({ name: "Valid Task" });
      }).not.toThrow();
    });

    test("should validate priority values", () => {
      const validPriorities = ["high", "medium", "low", "none"];
      
      validPriorities.forEach(priority => {
        const task = db.tasks.create({
          name: `Task with ${priority} priority`,
          priority: priority as "high" | "medium" | "low" | "none",
        });
        expect(task.priority).toBe(priority);
      });
    });

    test("should validate date format", () => {
      const validDate = new Date().toISOString();
      const task = db.tasks.create({
        name: "Task with date",
        date: validDate,
      });
      
      expect(task.date).toBe(validDate);
      expect(new Date(task.date!).toString()).not.toBe("Invalid Date");
    });
  });

  describe("Error Recovery Flow", () => {
    test("should handle update of non-existent task", () => {
      const result = db.tasks.update("non-existent-id", { name: "Updated" });
      expect(result).toBeNull();
    });

    test("should handle delete of non-existent task", () => {
      expect(() => {
        db.tasks.delete("non-existent-id");
      }).not.toThrow();
    });

    test("should maintain data integrity on error", () => {
      db.tasks.create({ name: "Task 1" });
      
      // Attempt invalid operation
      try {
        db.tasks.create({ name: "" });
      } catch {
        // Expected error
      }
      
      // Verify existing data is intact
      const allTasks = db.tasks.findMany();
      expect(allTasks.length).toBe(1);
    });
  });
});
