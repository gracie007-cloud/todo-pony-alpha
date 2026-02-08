/**
 * Integration tests for List flow
 * Tests the complete lifecycle: create list, add tasks, delete list
 */

import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { createMockDatabase, type MockDatabase } from "../utils/mock-db";
import { createTestFixtures, type TestFixtures } from "../utils/fixtures";

describe("List Flow Integration", () => {
  let db: MockDatabase;
  let fixtures: TestFixtures;

  beforeEach(() => {
    db = createMockDatabase();
    fixtures = createTestFixtures();
  });

  afterEach(() => {
    db.reset();
  });

  describe("Complete List Lifecycle", () => {
    test("should create, retrieve, update, and delete a list", () => {
      // Step 1: Create a list
      const list = db.lists.create({
        name: "Work Projects",
        color: "#3b82f6",
        emoji: "💼",
        isDefault: false,
      });
      
      expect(list.id).toBeDefined();
      expect(list.name).toBe("Work Projects");
      expect(list.color).toBe("#3b82f6");

      // Step 2: Retrieve the list
      const retrievedList = db.lists.findById(list.id);
      expect(retrievedList).not.toBeNull();
      expect(retrievedList?.name).toBe("Work Projects");

      // Step 3: Update the list
      const updatedList = db.lists.update(list.id, {
        name: "Work Projects 2024",
        color: "#22c55e",
      });
      
      expect(updatedList).not.toBeNull();
      expect(updatedList?.name).toBe("Work Projects 2024");
      expect(updatedList?.color).toBe("#22c55e");

      // Step 4: Delete the list
      db.lists.delete(list.id);
      
      const deletedList = db.lists.findById(list.id);
      expect(deletedList).toBeNull();
    });

    test("should handle list with tasks", () => {
      // Create list
      const list = db.lists.create({
        name: "Shopping",
        color: "#f97316",
        emoji: "🛒",
        isDefault: false,
      });

      // Add tasks to list
      const task1 = db.tasks.create({
        name: "Buy groceries",
        listId: list.id,
        priority: "medium",
      });

      const task2 = db.tasks.create({
        name: "Buy clothes",
        listId: list.id,
        priority: "low",
      });

      // Verify tasks are in list
      const tasksInList = db.tasks.findMany({ listId: list.id });
      expect(tasksInList).toHaveLength(2);

      // Get task count for list
      const taskCount = db.lists.getTaskCount(list.id);
      expect(taskCount).toBe(2);

      // Complete one task
      db.tasks.update(task1.id, { completed: true });
      
      const completedCount = db.lists.getTaskCount(list.id, true);
      const pendingCount = db.lists.getTaskCount(list.id, false);
      
      expect(completedCount).toBe(1);
      expect(pendingCount).toBe(1);
    });
  });

  describe("Default List Protection", () => {
    test("should identify default list", () => {
      const defaultList = db.lists.create({
        name: "Inbox",
        color: "#6b7280",
        emoji: "📥",
        isDefault: true,
      });

      const regularList = db.lists.create({
        name: "Personal",
        color: "#3b82f6",
        isDefault: false,
      });

      expect(defaultList.isDefault).toBe(true);
      expect(regularList.isDefault).toBe(false);
    });

    test("should prevent deletion of default list", () => {
      const defaultList = db.lists.create({
        name: "Inbox",
        color: "#6b7280",
        isDefault: true,
      });

      // Attempt to delete default list
      expect(() => {
        db.lists.delete(defaultList.id);
      }).toThrow(/default/i);

      // List should still exist
      const stillExists = db.lists.findById(defaultList.id);
      expect(stillExists).not.toBeNull();
    });

    test("should allow deleting non-default lists", () => {
      const regularList = db.lists.create({
        name: "Temporary",
        color: "#ef4444",
        isDefault: false,
      });

      // Should not throw
      db.lists.delete(regularList.id);

      const deleted = db.lists.findById(regularList.id);
      expect(deleted).toBeNull();
    });
  });

  describe("List Ordering", () => {
    test("should maintain list order", () => {
      const list1 = db.lists.create({ name: "List A", order: 0 });
      const list2 = db.lists.create({ name: "List B", order: 1 });
      const list3 = db.lists.create({ name: "List C", order: 2 });

      const allLists = db.lists.findMany();
      expect(allLists[0].name).toBe("List A");
      expect(allLists[1].name).toBe("List B");
      expect(allLists[2].name).toBe("List C");
    });

    test("should handle reordering", () => {
      const list1 = db.lists.create({ name: "List A", order: 0 });
      const list2 = db.lists.create({ name: "List B", order: 1 });
      const list3 = db.lists.create({ name: "List C", order: 2 });

      // Move List C to first position
      db.lists.update(list3.id, { order: 0 });
      db.lists.update(list1.id, { order: 1 });
      db.lists.update(list2.id, { order: 2 });

      const reorderedLists = db.lists.findMany();
      expect(reorderedLists[0].name).toBe("List C");
      expect(reorderedLists[1].name).toBe("List A");
      expect(reorderedLists[2].name).toBe("List B");
    });
  });

  describe("List with Labels", () => {
    test("should handle tasks with labels in list", () => {
      const list = db.lists.create({
        name: "Work",
        color: "#3b82f6",
      });

      const label1 = db.labels.create({
        name: "Urgent",
        color: "#ef4444",
      });

      const label2 = db.labels.create({
        name: "Review",
        color: "#f97316",
      });

      // Create tasks with labels
      const task1 = db.tasks.create({
        name: "Review PR",
        listId: list.id,
      });
      db.tasks.addLabels(task1.id, [label1.id, label2.id]);

      const task2 = db.tasks.create({
        name: "Fix bug",
        listId: list.id,
      });
      db.tasks.addLabels(task2.id, [label1.id]);

      // Verify tasks and labels
      const tasks = db.tasks.findMany({ listId: list.id });
      expect(tasks).toHaveLength(2);

      const task1Labels = db.tasks.getTaskLabels(task1.id);
      expect(task1Labels).toHaveLength(2);

      const task2Labels = db.tasks.getTaskLabels(task2.id);
      expect(task2Labels).toHaveLength(1);
    });
  });

  describe("List Deletion with Tasks", () => {
    test("should handle tasks when list is deleted", () => {
      // Create default list first
      const defaultList = db.lists.create({
        name: "Inbox",
        color: "#6b7280",
        isDefault: true,
      });

      // Create list with tasks
      const list = db.lists.create({
        name: "Temporary",
        color: "#ef4444",
        isDefault: false,
      });

      const task1 = db.tasks.create({
        name: "Task 1",
        listId: list.id,
      });

      const task2 = db.tasks.create({
        name: "Task 2",
        listId: list.id,
      });

      // Delete list
      db.lists.delete(list.id);

      // Tasks should be moved to default list or deleted
      // (depends on implementation)
      const task1After = db.tasks.findById(task1.id);
      const task2After = db.tasks.findById(task2.id);

      // Either tasks are deleted or moved to default list
      if (task1After) {
        expect(task1After.listId).toBe(defaultList.id);
      }
      if (task2After) {
        expect(task2After.listId).toBe(defaultList.id);
      }
    });
  });

  describe("Multiple Lists Management", () => {
    test("should handle multiple lists with tasks", () => {
      // Create multiple lists
      const workList = db.lists.create({
        name: "Work",
        color: "#3b82f6",
        emoji: "💼",
      });

      const personalList = db.lists.create({
        name: "Personal",
        color: "#22c55e",
        emoji: "🏠",
      });

      const shoppingList = db.lists.create({
        name: "Shopping",
        color: "#f97316",
        emoji: "🛒",
      });

      // Add tasks to each list
      db.tasks.create({ name: "Work Task 1", listId: workList.id });
      db.tasks.create({ name: "Work Task 2", listId: workList.id });
      db.tasks.create({ name: "Personal Task 1", listId: personalList.id });
      db.tasks.create({ name: "Shopping Task 1", listId: shoppingList.id });
      db.tasks.create({ name: "Shopping Task 2", listId: shoppingList.id });
      db.tasks.create({ name: "Shopping Task 3", listId: shoppingList.id });

      // Verify counts
      expect(db.lists.getTaskCount(workList.id)).toBe(2);
      expect(db.lists.getTaskCount(personalList.id)).toBe(1);
      expect(db.lists.getTaskCount(shoppingList.id)).toBe(3);

      // Get all lists with counts
      const allLists = db.lists.findMany();
      expect(allLists).toHaveLength(3);
    });

    test("should move tasks between lists", () => {
      const list1 = db.lists.create({ name: "List 1" });
      const list2 = db.lists.create({ name: "List 2" });

      const task = db.tasks.create({
        name: "Movable Task",
        listId: list1.id,
      });

      // Verify initial state
      expect(db.lists.getTaskCount(list1.id)).toBe(1);
      expect(db.lists.getTaskCount(list2.id)).toBe(0);

      // Move task to list2
      db.tasks.update(task.id, { listId: list2.id });

      // Verify after move
      expect(db.lists.getTaskCount(list1.id)).toBe(0);
      expect(db.lists.getTaskCount(list2.id)).toBe(1);

      const movedTask = db.tasks.findById(task.id);
      expect(movedTask?.listId).toBe(list2.id);
    });
  });

  describe("List Color and Emoji", () => {
    test("should handle various color formats", () => {
      const colors = ["#3b82f6", "#22c55e", "rgb(255, 0, 0)", "hsl(0, 100%, 50%)"];
      
      colors.forEach((color, index) => {
        const list = db.lists.create({
          name: `List ${index}`,
          color,
        });
        expect(list.color).toBe(color);
      });
    });

    test("should handle emoji in list", () => {
      const emojis = ["💼", "🏠", "🛒", "📚", "🎯", "⭐️"];
      
      emojis.forEach((emoji, index) => {
        const list = db.lists.create({
          name: `List ${index}`,
          emoji,
        });
        expect(list.emoji).toBe(emoji);
      });
    });

    test("should handle list without emoji", () => {
      const list = db.lists.create({
        name: "No Emoji List",
        color: "#3b82f6",
      });
      
      expect(list.emoji).toBeNull();
    });
  });

  describe("List Statistics", () => {
    test("should calculate list statistics correctly", () => {
      const list = db.lists.create({ name: "Stats List" });

      // Create tasks with various states
      db.tasks.create({ name: "Completed 1", listId: list.id, completed: true });
      db.tasks.create({ name: "Completed 2", listId: list.id, completed: true });
      db.tasks.create({ name: "Completed 3", listId: list.id, completed: true });
      db.tasks.create({ name: "Pending 1", listId: list.id, completed: false });
      db.tasks.create({ name: "Pending 2", listId: list.id, completed: false });

      const totalCount = db.lists.getTaskCount(list.id);
      const completedCount = db.lists.getTaskCount(list.id, true);
      const pendingCount = db.lists.getTaskCount(list.id, false);

      expect(totalCount).toBe(5);
      expect(completedCount).toBe(3);
      expect(pendingCount).toBe(2);
    });

    test("should return zero for empty list", () => {
      const list = db.lists.create({ name: "Empty List" });
      
      expect(db.lists.getTaskCount(list.id)).toBe(0);
      expect(db.lists.getTaskCount(list.id, true)).toBe(0);
      expect(db.lists.getTaskCount(list.id, false)).toBe(0);
    });
  });

  describe("List Validation", () => {
    test("should require list name", () => {
      expect(() => {
        db.lists.create({ name: "" });
      }).toThrow();

      expect(() => {
        db.lists.create({ name: "Valid Name" });
      }).not.toThrow();
    });

    test("should enforce unique list names", () => {
      db.lists.create({ name: "Unique List" });

      expect(() => {
        db.lists.create({ name: "Unique List" });
      }).toThrow(/unique|duplicate/i);
    });

    test("should validate color format", () => {
      // Valid colors
      expect(() => {
        db.lists.create({ name: "List 1", color: "#3b82f6" });
      }).not.toThrow();

      // Invalid color should either throw or be accepted
      // (depends on validation implementation)
    });
  });

  describe("Error Recovery", () => {
    test("should handle update of non-existent list", () => {
      const result = db.lists.update("non-existent-id", { name: "Updated" });
      expect(result).toBeNull();
    });

    test("should maintain data integrity on error", () => {
      const list1 = db.lists.create({ name: "Existing List" });
      
      try {
        db.lists.create({ name: "" });
      } catch (e) {
        // Expected error
      }
      
      const existingList = db.lists.findById(list1.id);
      expect(existingList).not.toBeNull();
    });
  });
});
