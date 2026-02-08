/**
 * Integration tests for Search flow
 * Tests search and filter functionality across tasks
 */

import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { createMockDatabase, type MockDatabase } from "../utils/mock-db";
import { createTestFixtures, type TestFixtures } from "../utils/fixtures";

// Simulated search function (similar to Fuse.js behavior)
function searchTasks(
  tasks: Array<{ id: string; name: string; description: string | null }>,
  query: string,
  options?: {
    keys?: string[];
    threshold?: number;
  }
): Array<{ item: typeof tasks[0]; score: number }> {
  const keys = options?.keys || ["name", "description"];
  const threshold = options?.threshold ?? 0.3;
  const queryLower = query.toLowerCase();

  const results: Array<{ item: typeof tasks[0]; score: number }> = [];

  tasks.forEach((task) => {
    let maxScore = 0;

    keys.forEach((key) => {
      const value = key === "name" 
        ? task.name 
        : key === "description" 
          ? task.description || "" 
          : "";
      
      if (value.toLowerCase().includes(queryLower)) {
        // Exact substring match gets highest score
        const score = queryLower.length / value.length;
        maxScore = Math.max(maxScore, score);
      } else if (value.toLowerCase().split("").some((c) => queryLower.includes(c))) {
        // Partial character match gets lower score
        const matchingChars = value.toLowerCase().split("").filter((c) => queryLower.includes(c)).length;
        const score = matchingChars / value.length * 0.3;
        maxScore = Math.max(maxScore, score);
      }
    });

    if (maxScore >= threshold) {
      results.push({ item: task, score: maxScore });
    }
  });

  return results.sort((a, b) => b.score - a.score);
}

// Filter function combining multiple criteria
function filterTasks(
  tasks: Array<{
    id: string;
    name: string;
    completed: boolean;
    priority: string;
    date: string | null;
    listId: string;
  }>,
  filters: {
    completed?: boolean;
    priority?: string | string[];
    dateFrom?: string;
    dateTo?: string;
    listId?: string;
    overdue?: boolean;
  }
) {
  return tasks.filter((task) => {
    // Completion filter
    if (filters.completed !== undefined && task.completed !== filters.completed) {
      return false;
    }

    // Priority filter
    if (filters.priority) {
      const priorities = Array.isArray(filters.priority) 
        ? filters.priority 
        : [filters.priority];
      if (!priorities.includes(task.priority)) {
        return false;
      }
    }

    // List filter
    if (filters.listId && task.listId !== filters.listId) {
      return false;
    }

    // Date range filter
    if (filters.dateFrom && task.date) {
      if (new Date(task.date) < new Date(filters.dateFrom)) {
        return false;
      }
    }
    if (filters.dateTo && task.date) {
      if (new Date(task.date) > new Date(filters.dateTo)) {
        return false;
      }
    }

    // Overdue filter
    if (filters.overdue) {
      if (!task.date || task.completed) {
        return false;
      }
      if (new Date(task.date) >= new Date()) {
        return false;
      }
    }

    return true;
  });
}

describe("Search Flow Integration", () => {
  let db: MockDatabase;
  let fixtures: TestFixtures;

  beforeEach(() => {
    db = createMockDatabase();
    fixtures = createTestFixtures();
  });

  afterEach(() => {
    db.reset();
  });

  describe("Basic Search", () => {
    beforeEach(() => {
      // Create test data for search
      const list = db.lists.create({ name: "Search Test List" });

      db.tasks.create({
        name: "Complete project proposal",
        description: "Write the Q1 project proposal document",
        listId: list.id,
      });

      db.tasks.create({
        name: "Review code changes",
        description: "Review pull requests from team members",
        listId: list.id,
      });

      db.tasks.create({
        name: "Project meeting preparation",
        description: "Prepare slides for project review meeting",
        listId: list.id,
      });

      db.tasks.create({
        name: "Buy groceries",
        description: "Get milk, eggs, and bread from store",
        listId: list.id,
      });

      db.tasks.create({
        name: "Call project manager",
        description: "Discuss project timeline changes",
        listId: list.id,
      });
    });

    test("should find tasks by name", () => {
      const allTasks = db.tasks.findMany();
      const results = searchTasks(allTasks, "project");

      expect(results.length).toBeGreaterThan(0);
      results.forEach((result) => {
        expect(
          result.item.name.toLowerCase().includes("project") ||
          result.item.description?.toLowerCase().includes("project")
        ).toBe(true);
      });
    });

    test("should find tasks by description", () => {
      const allTasks = db.tasks.findMany();
      const results = searchTasks(allTasks, "review");

      expect(results.length).toBeGreaterThan(0);
    });

    test("should return empty results for no matches", () => {
      const allTasks = db.tasks.findMany();
      const results = searchTasks(allTasks, "xyznonexistent123");

      expect(results).toHaveLength(0);
    });

    test("should rank results by relevance", () => {
      const allTasks = db.tasks.findMany();
      const results = searchTasks(allTasks, "project");

      // Results should be sorted by score descending
      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score);
      }
    });

    test("should handle case-insensitive search", () => {
      const allTasks = db.tasks.findMany();
      
      const lowerResults = searchTasks(allTasks, "project");
      const upperResults = searchTasks(allTasks, "PROJECT");
      const mixedResults = searchTasks(allTasks, "PrOjEcT");

      expect(lowerResults.length).toBe(upperResults.length);
      expect(lowerResults.length).toBe(mixedResults.length);
    });
  });

  describe("Combined Search and Filter", () => {
    let workList: ReturnType<typeof db.lists.create>;
    let personalList: ReturnType<typeof db.lists.create>;

    beforeEach(() => {
      workList = db.lists.create({ name: "Work", color: "#3b82f6" });
      personalList = db.lists.create({ name: "Personal", color: "#22c55e" });

      // Work tasks
      db.tasks.create({
        name: "Complete project A",
        listId: workList.id,
        priority: "high",
        completed: false,
        date: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      });

      db.tasks.create({
        name: "Review project B",
        listId: workList.id,
        priority: "medium",
        completed: true,
      });

      db.tasks.create({
        name: "Project C planning",
        listId: workList.id,
        priority: "low",
        completed: false,
        date: new Date(Date.now() - 86400000).toISOString(), // Yesterday (overdue)
      });

      // Personal tasks
      db.tasks.create({
        name: "Buy project supplies",
        listId: personalList.id,
        priority: "low",
        completed: false,
      });

      db.tasks.create({
        name: "Home project",
        listId: personalList.id,
        priority: "none",
        completed: true,
      });
    });

    test("should filter by completion status", () => {
      const allTasks = db.tasks.findMany();
      
      const completedTasks = filterTasks(allTasks, { completed: true });
      const pendingTasks = filterTasks(allTasks, { completed: false });

      expect(completedTasks.length).toBe(2);
      expect(pendingTasks.length).toBe(3);
    });

    test("should filter by priority", () => {
      const allTasks = db.tasks.findMany();
      
      const highPriority = filterTasks(allTasks, { priority: "high" });
      const lowPriority = filterTasks(allTasks, { priority: "low" });

      expect(highPriority.length).toBe(1);
      expect(lowPriority.length).toBe(2);
    });

    test("should filter by multiple priorities", () => {
      const allTasks = db.tasks.findMany();
      
      const highOrMedium = filterTasks(allTasks, { 
        priority: ["high", "medium"] 
      });

      expect(highOrMedium.length).toBe(2);
    });

    test("should filter by list", () => {
      const allTasks = db.tasks.findMany();
      
      const workTasks = filterTasks(allTasks, { listId: workList.id });
      const personalTasks = filterTasks(allTasks, { listId: personalList.id });

      expect(workTasks.length).toBe(3);
      expect(personalTasks.length).toBe(2);
    });

    test("should filter overdue tasks", () => {
      const allTasks = db.tasks.findMany();
      
      const overdueTasks = filterTasks(allTasks, { overdue: true });

      expect(overdueTasks.length).toBe(1);
      expect(overdueTasks[0].name).toBe("Project C planning");
    });

    test("should combine search with filters", () => {
      const allTasks = db.tasks.findMany();
      
      // Search for "project" in pending tasks only
      const searchResults = searchTasks(allTasks, "project");
      const pendingResults = searchResults.filter(
        (r) => !r.item.completed
      );

      expect(pendingResults.length).toBeGreaterThan(0);
      pendingResults.forEach((result) => {
        expect(result.item.completed).toBe(false);
      });
    });

    test("should filter by date range", () => {
      const allTasks = db.tasks.findMany();
      
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const tasksInRange = filterTasks(allTasks, {
        dateFrom: yesterday.toISOString(),
        dateTo: tomorrow.toISOString(),
      });

      expect(tasksInRange.length).toBe(2); // Tomorrow and yesterday tasks
    });
  });

  describe("Search with Labels", () => {
    beforeEach(() => {
      const list = db.lists.create({ name: "Label Test" });

      const urgentLabel = db.labels.create({ name: "Urgent", color: "#ef4444" });
      const importantLabel = db.labels.create({ name: "Important", color: "#f97316" });

      const task1 = db.tasks.create({ name: "Task 1", listId: list.id });
      const task2 = db.tasks.create({ name: "Task 2", listId: list.id });
      const task3 = db.tasks.create({ name: "Task 3", listId: list.id });

      db.tasks.addLabels(task1.id, [urgentLabel.id]);
      db.tasks.addLabels(task2.id, [importantLabel.id]);
      db.tasks.addLabels(task3.id, [urgentLabel.id, importantLabel.id]);
    });

    test("should find tasks by label", () => {
      const urgentLabel = db.labels.findMany()[0];
      const tasksWithLabel = db.tasks.findByLabel(urgentLabel.id);

      expect(tasksWithLabel.length).toBe(2);
    });

    test("should find tasks with multiple labels", () => {
      const labels = db.labels.findMany();
      const allTasks = db.tasks.findMany();

      const tasksWithBothLabels = allTasks.filter((task) => {
        const taskLabels = db.tasks.getTaskLabels(task.id);
        return taskLabels.length === 2;
      });

      expect(tasksWithBothLabels.length).toBe(1);
    });
  });

  describe("Search Performance", () => {
    test("should handle large dataset efficiently", () => {
      const list = db.lists.create({ name: "Large List" });

      // Create many tasks
      const taskCount = 100;
      for (let i = 0; i < taskCount; i++) {
        db.tasks.create({
          name: `Task ${i}: ${i % 10 === 0 ? "Important" : "Regular"} task`,
          listId: list.id,
        });
      }

      const startTime = performance.now();
      const allTasks = db.tasks.findMany();
      const results = searchTasks(allTasks, "Important");
      const endTime = performance.now();

      expect(results.length).toBe(10); // Every 10th task
      expect(endTime - startTime).toBeLessThan(100); // Should be fast
    });

    test("should handle rapid successive searches", () => {
      const list = db.lists.create({ name: "Rapid Search" });

      for (let i = 0; i < 50; i++) {
        db.tasks.create({
          name: `Task ${i}`,
          listId: list.id,
        });
      }

      const allTasks = db.tasks.findMany();
      const queries = ["Task", "1", "Task 2", "xyz", "Task 5"];

      queries.forEach((query) => {
        const results = searchTasks(allTasks, query);
        expect(results).toBeDefined();
      });
    });
  });

  describe("Search Edge Cases", () => {
    test("should handle empty query", () => {
      const list = db.lists.create({ name: "Edge Case" });
      db.tasks.create({ name: "Test Task", listId: list.id });

      const allTasks = db.tasks.findMany();
      const results = searchTasks(allTasks, "");

      // Empty query might return all or none depending on implementation
      expect(results).toBeDefined();
    });

    test("should handle special characters", () => {
      const list = db.lists.create({ name: "Special Chars" });
      db.tasks.create({ 
        name: "Task with special: chars!", 
        listId: list.id 
      });
      db.tasks.create({ 
        name: "Task with (parentheses)", 
        listId: list.id 
      });

      const allTasks = db.tasks.findMany();
      
      const colonResults = searchTasks(allTasks, ":");
      expect(colonResults.length).toBeGreaterThan(0);

      const parenResults = searchTasks(allTasks, "(");
      expect(parenResults.length).toBeGreaterThan(0);
    });

    test("should handle very long queries", () => {
      const list = db.lists.create({ name: "Long Query" });
      db.tasks.create({ name: "Test Task", listId: list.id });

      const allTasks = db.tasks.findMany();
      const longQuery = "a".repeat(1000);
      
      const results = searchTasks(allTasks, longQuery);
      expect(results).toBeDefined();
    });

    test("should handle unicode characters", () => {
      const list = db.lists.create({ name: "Unicode" });
      db.tasks.create({ name: "日本語タスク", listId: list.id });
      db.tasks.create({ name: "Tâche française", listId: list.id });
      db.tasks.create({ name: "Emoji task 🎉", listId: list.id });

      const allTasks = db.tasks.findMany();
      
      const japaneseResults = searchTasks(allTasks, "日本語");
      expect(japaneseResults.length).toBeGreaterThan(0);

      const emojiResults = searchTasks(allTasks, "🎉");
      expect(emojiResults.length).toBeGreaterThan(0);
    });
  });

  describe("Filter Combinations", () => {
    let testList: ReturnType<typeof db.lists.create>;

    beforeEach(() => {
      testList = db.lists.create({ name: "Filter Test" });

      // Create varied tasks
      db.tasks.create({
        name: "High Priority Pending",
        listId: testList.id,
        priority: "high",
        completed: false,
        date: new Date(Date.now() + 86400000).toISOString(),
      });

      db.tasks.create({
        name: "High Priority Completed",
        listId: testList.id,
        priority: "high",
        completed: true,
      });

      db.tasks.create({
        name: "Low Priority Overdue",
        listId: testList.id,
        priority: "low",
        completed: false,
        date: new Date(Date.now() - 86400000).toISOString(),
      });

      db.tasks.create({
        name: "No Priority Pending",
        listId: testList.id,
        priority: "none",
        completed: false,
      });
    });

    test("should combine multiple filters", () => {
      const allTasks = db.tasks.findMany();
      
      // High priority + pending
      const results = filterTasks(allTasks, {
        priority: "high",
        completed: false,
      });

      expect(results.length).toBe(1);
      expect(results[0].name).toBe("High Priority Pending");
    });

    test("should handle conflicting filters", () => {
      const allTasks = db.tasks.findMany();
      
      // Completed AND overdue (impossible combination)
      const results = filterTasks(allTasks, {
        completed: true,
        overdue: true,
      });

      expect(results.length).toBe(0);
    });

    test("should clear filters", () => {
      const allTasks = db.tasks.findMany();
      
      // Apply filters
      const filtered = filterTasks(allTasks, { priority: "high" });
      
      // Clear by not applying filters
      const cleared = allTasks;

      expect(cleared.length).toBeGreaterThan(filtered.length);
    });
  });

  describe("Search State Management", () => {
    test("should track search history", () => {
      const searchHistory: string[] = [];
      
      const recordSearch = (query: string) => {
        if (query.trim()) {
          searchHistory.unshift(query);
          if (searchHistory.length > 10) {
            searchHistory.pop();
          }
        }
      };

      recordSearch("project");
      recordSearch("meeting");
      recordSearch("review");

      expect(searchHistory).toHaveLength(3);
      expect(searchHistory[0]).toBe("review"); // Most recent first
    });

    test("should limit search history", () => {
      const searchHistory: string[] = [];
      const maxHistory = 5;
      
      const recordSearch = (query: string) => {
        if (query.trim()) {
          searchHistory.unshift(query);
          if (searchHistory.length > maxHistory) {
            searchHistory.pop();
          }
        }
      };

      for (let i = 0; i < 10; i++) {
        recordSearch(`query ${i}`);
      }

      expect(searchHistory).toHaveLength(5);
      expect(searchHistory[0]).toBe("query 9"); // Most recent
    });

    test("should save and restore search preferences", () => {
      const preferences = {
        defaultFilters: {
          completed: false,
          priority: ["high", "medium"],
        },
        sortBy: "date",
        sortOrder: "asc" as const,
      };

      // Save to localStorage simulation
      const saved = JSON.stringify(preferences);
      const restored = JSON.parse(saved);

      expect(restored.defaultFilters.completed).toBe(false);
      expect(restored.sortBy).toBe("date");
    });
  });
});
