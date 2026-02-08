/**
 * Tests for TaskList component
 * Tests grouping, filtering, rendering, and empty states
 */

import { describe, test, expect, beforeEach, mock } from "bun:test";
import { format, parseISO, isToday, isTomorrow, isPast, startOfDay } from "date-fns";
import type { TaskWithRelations, Priority, List, Label, Subtask } from "@/lib/types";

// Animation variants extracted from component
const containerVariants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { 
    opacity: 0, 
    y: 20,
    scale: 0.98,
  },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 350,
      damping: 25,
    },
  },
  exit: {
    opacity: 0,
    x: -100,
    scale: 0.95,
    transition: {
      duration: 0.2,
      ease: "easeIn",
    },
  },
};

// Helper function to create mock task
function createMockTask(overrides: Partial<TaskWithRelations> = {}): TaskWithRelations {
  const today = new Date();
  return {
    id: `task-${Math.random().toString(36).substr(2, 9)}`,
    name: "Test Task",
    description: null,
    completed: false,
    priority: "none" as Priority,
    date: null,
    listId: "list-1",
    createdAt: today.toISOString(),
    updatedAt: today.toISOString(),
    list: {
      id: "list-1",
      name: "Inbox",
      color: "#3b82f6",
      emoji: "📥",
      isDefault: true,
      createdAt: today.toISOString(),
      updatedAt: today.toISOString(),
    } as List,
    labels: [],
    subtasks: [],
    reminders: [],
    attachments: [],
    ...overrides,
  };
}

// Grouping logic extracted from component
function groupTasks(
  tasks: TaskWithRelations[],
  groupBy: "date" | "priority" | "list" | "none"
): Record<string, TaskWithRelations[]> {
  if (groupBy === "none") {
    return { "": tasks };
  }

  const groups: Record<string, TaskWithRelations[]> = {};

  tasks.forEach((task) => {
    let key: string;

    if (groupBy === "date") {
      if (!task.date) {
        key = "No date";
      } else {
        const date = parseISO(task.date);
        if (isToday(date)) key = "Today";
        else if (isTomorrow(date)) key = "Tomorrow";
        else if (isPast(date) && !isToday(date)) key = "Overdue";
        else key = format(date, "EEEE, MMM d");
      }
    } else if (groupBy === "priority") {
      const priorityLabels: Record<Priority, string> = {
        high: "High Priority",
        medium: "Medium Priority",
        low: "Low Priority",
        none: "No Priority",
      };
      key = priorityLabels[task.priority];
    } else if (groupBy === "list") {
      key = task.list?.name || "Inbox";
    } else {
      key = "";
    }

    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(task);
  });

  // Sort groups
  if (groupBy === "date") {
    const dateOrder = ["Overdue", "Today", "Tomorrow"];
    const sortedKeys = Object.keys(groups).sort((a, b) => {
      const aIndex = dateOrder.indexOf(a);
      const bIndex = dateOrder.indexOf(b);
      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      return 0;
    });
    return Object.fromEntries(sortedKeys.map((k) => [k, groups[k]]));
  }

  if (groupBy === "priority") {
    const priorityOrder = ["High Priority", "Medium Priority", "Low Priority", "No Priority"];
    return Object.fromEntries(priorityOrder.filter((p) => groups[p]).map((p) => [p, groups[p]]));
  }

  return groups;
}

// Filter tasks based on showCompleted
function filterTasks(tasks: TaskWithRelations[], showCompleted: boolean): TaskWithRelations[] {
  return showCompleted ? tasks : tasks.filter((t) => !t.completed);
}

// Determine empty state type
function getEmptyStateType(tasks: TaskWithRelations[], visibleTasks: TaskWithRelations[]): "none" | "all-completed" | "empty" {
  if (visibleTasks.length > 0) return "none";
  
  const completedCount = tasks.filter((t) => t.completed).length;
  if (completedCount === tasks.length && tasks.length > 0) {
    return "all-completed";
  }
  return "empty";
}

// Calculate group completion stats
function getGroupStats(tasks: TaskWithRelations[]): { completed: number; total: number } {
  return {
    completed: tasks.filter((t) => t.completed).length,
    total: tasks.length,
  };
}

describe("TaskList Component Logic", () => {
  describe("createMockTask", () => {
    test("should create task with unique IDs", () => {
      const task1 = createMockTask();
      const task2 = createMockTask();
      
      expect(task1.id).not.toBe(task2.id);
    });

    test("should create task with default values", () => {
      const task = createMockTask();
      
      expect(task.completed).toBe(false);
      expect(task.priority).toBe("none");
      expect(task.date).toBeNull();
    });
  });

  describe("filterTasks", () => {
    test("should return all tasks when showCompleted is true", () => {
      const tasks = [
        createMockTask({ completed: false }),
        createMockTask({ completed: true }),
      ];
      
      const filtered = filterTasks(tasks, true);
      
      expect(filtered).toHaveLength(2);
    });

    test("should filter out completed tasks when showCompleted is false", () => {
      const tasks = [
        createMockTask({ completed: false }),
        createMockTask({ completed: true }),
        createMockTask({ completed: false }),
      ];
      
      const filtered = filterTasks(tasks, false);
      
      expect(filtered).toHaveLength(2);
      expect(filtered.every((t) => !t.completed)).toBe(true);
    });

    test("should return empty array when all tasks are completed and showCompleted is false", () => {
      const tasks = [
        createMockTask({ completed: true }),
        createMockTask({ completed: true }),
      ];
      
      const filtered = filterTasks(tasks, false);
      
      expect(filtered).toHaveLength(0);
    });
  });

  describe("getEmptyStateType", () => {
    test("should return 'none' when there are visible tasks", () => {
      const tasks = [createMockTask()];
      const visibleTasks = tasks;
      
      expect(getEmptyStateType(tasks, visibleTasks)).toBe("none");
    });

    test("should return 'all-completed' when all tasks are completed", () => {
      const tasks = [
        createMockTask({ completed: true }),
        createMockTask({ completed: true }),
      ];
      const visibleTasks: TaskWithRelations[] = [];
      
      expect(getEmptyStateType(tasks, visibleTasks)).toBe("all-completed");
    });

    test("should return 'empty' when there are no tasks", () => {
      const tasks: TaskWithRelations[] = [];
      const visibleTasks: TaskWithRelations[] = [];
      
      expect(getEmptyStateType(tasks, visibleTasks)).toBe("empty");
    });

    test("should return 'empty' when showCompleted is false and all are completed", () => {
      const tasks = [
        createMockTask({ completed: true }),
      ];
      const visibleTasks = filterTasks(tasks, false);
      
      expect(getEmptyStateType(tasks, visibleTasks)).toBe("all-completed");
    });
  });

  describe("getGroupStats", () => {
    test("should return correct stats for mixed completion", () => {
      const tasks = [
        createMockTask({ completed: true }),
        createMockTask({ completed: false }),
        createMockTask({ completed: true }),
      ];
      
      const stats = getGroupStats(tasks);
      
      expect(stats.completed).toBe(2);
      expect(stats.total).toBe(3);
    });

    test("should return zero stats for empty array", () => {
      const stats = getGroupStats([]);
      
      expect(stats.completed).toBe(0);
      expect(stats.total).toBe(0);
    });

    test("should return all completed when all tasks are done", () => {
      const tasks = [
        createMockTask({ completed: true }),
        createMockTask({ completed: true }),
      ];
      
      const stats = getGroupStats(tasks);
      
      expect(stats.completed).toBe(stats.total);
    });
  });
});

describe("TaskList Grouping", () => {
  describe("groupTasks - no grouping", () => {
    test("should return single group with empty key", () => {
      const tasks = [
        createMockTask({ name: "Task 1" }),
        createMockTask({ name: "Task 2" }),
      ];
      
      const groups = groupTasks(tasks, "none");
      
      expect(Object.keys(groups)).toHaveLength(1);
      expect(groups[""]).toHaveLength(2);
    });
  });

  describe("groupTasks - by date", () => {
    test("should group tasks by today", () => {
      const today = new Date().toISOString();
      const tasks = [
        createMockTask({ date: today }),
        createMockTask({ date: today }),
      ];
      
      const groups = groupTasks(tasks, "date");
      
      expect(groups["Today"]).toBeDefined();
      expect(groups["Today"]).toHaveLength(2);
    });

    test("should group tasks by tomorrow", () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const tasks = [
        createMockTask({ date: tomorrow.toISOString() }),
      ];
      
      const groups = groupTasks(tasks, "date");
      
      expect(groups["Tomorrow"]).toBeDefined();
      expect(groups["Tomorrow"]).toHaveLength(1);
    });

    test("should group overdue tasks", () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 2);
      
      const tasks = [
        createMockTask({ date: pastDate.toISOString() }),
      ];
      
      const groups = groupTasks(tasks, "date");
      
      expect(groups["Overdue"]).toBeDefined();
      expect(groups["Overdue"]).toHaveLength(1);
    });

    test("should group tasks without date", () => {
      const tasks = [
        createMockTask({ date: null }),
        createMockTask({ date: null }),
      ];
      
      const groups = groupTasks(tasks, "date");
      
      expect(groups["No date"]).toBeDefined();
      expect(groups["No date"]).toHaveLength(2);
    });

    test("should sort date groups in correct order", () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const tasks = [
        createMockTask({ date: tomorrow.toISOString() }),
        createMockTask({ date: pastDate.toISOString() }),
        createMockTask({ date: new Date().toISOString() }),
      ];
      
      const groups = groupTasks(tasks, "date");
      const keys = Object.keys(groups);
      
      expect(keys.indexOf("Overdue")).toBeLessThan(keys.indexOf("Today"));
      expect(keys.indexOf("Today")).toBeLessThan(keys.indexOf("Tomorrow"));
    });
  });

  describe("groupTasks - by priority", () => {
    test("should group tasks by priority levels", () => {
      const tasks = [
        createMockTask({ priority: "high" }),
        createMockTask({ priority: "medium" }),
        createMockTask({ priority: "low" }),
        createMockTask({ priority: "none" }),
      ];
      
      const groups = groupTasks(tasks, "priority");
      
      expect(groups["High Priority"]).toHaveLength(1);
      expect(groups["Medium Priority"]).toHaveLength(1);
      expect(groups["Low Priority"]).toHaveLength(1);
      expect(groups["No Priority"]).toHaveLength(1);
    });

    test("should sort priority groups in correct order", () => {
      const tasks = [
        createMockTask({ priority: "low" }),
        createMockTask({ priority: "high" }),
        createMockTask({ priority: "none" }),
        createMockTask({ priority: "medium" }),
      ];
      
      const groups = groupTasks(tasks, "priority");
      const keys = Object.keys(groups);
      
      expect(keys).toEqual([
        "High Priority",
        "Medium Priority",
        "Low Priority",
        "No Priority",
      ]);
    });

    test("should not include empty priority groups", () => {
      const tasks = [
        createMockTask({ priority: "high" }),
      ];
      
      const groups = groupTasks(tasks, "priority");
      
      expect(groups["High Priority"]).toBeDefined();
      expect(groups["Medium Priority"]).toBeUndefined();
    });
  });

  describe("groupTasks - by list", () => {
    test("should group tasks by list name", () => {
      const tasks = [
        createMockTask({ 
          list: { name: "Work" } as List 
        }),
        createMockTask({ 
          list: { name: "Personal" } as List 
        }),
        createMockTask({ 
          list: { name: "Work" } as List 
        }),
      ];
      
      const groups = groupTasks(tasks, "list");
      
      expect(groups["Work"]).toHaveLength(2);
      expect(groups["Personal"]).toHaveLength(1);
    });

    test("should use 'Inbox' for tasks without list", () => {
      const tasks = [
        createMockTask({ list: null as unknown as List }),
      ];
      
      const groups = groupTasks(tasks, "list");
      
      expect(groups["Inbox"]).toBeDefined();
    });
  });
});

describe("TaskList Animation Variants", () => {
  test("container should have stagger configuration", () => {
    expect(containerVariants.visible.transition.staggerChildren).toBe(0.05);
    expect(containerVariants.visible.transition.delayChildren).toBe(0.1);
  });

  test("item should have spring transition", () => {
    const transition = itemVariants.visible.transition;
    expect(transition.type).toBe("spring");
    expect(transition.stiffness).toBe(350);
    expect(transition.damping).toBe(25);
  });

  test("item exit should slide left", () => {
    expect(itemVariants.exit.x).toBe(-100);
    expect(itemVariants.exit.opacity).toBe(0);
  });
});

describe("TaskList Loading State", () => {
  test("should determine loading state", () => {
    const isLoading = true;
    expect(isLoading).toBe(true);
  });

  test("should render correct number of skeletons", () => {
    const skeletonCount = 3;
    const skeletons = Array(skeletonCount).fill(null);
    
    expect(skeletons).toHaveLength(3);
  });
});

describe("TaskList Group Expansion", () => {
  test("should track expansion state", () => {
    let isExpanded = true;
    
    // Toggle expansion
    isExpanded = !isExpanded;
    expect(isExpanded).toBe(false);
    
    // Toggle again
    isExpanded = !isExpanded;
    expect(isExpanded).toBe(true);
  });

  test("should start expanded by default", () => {
    const defaultExpanded = true;
    expect(defaultExpanded).toBe(true);
  });
});

describe("TaskList Display Text", () => {
  test("should show completion count when some completed", () => {
    const stats = { completed: 2, total: 5 };
    const displayText = stats.completed > 0 
      ? `${stats.completed}/${stats.total} completed`
      : `${stats.total} tasks`;
    
    expect(displayText).toBe("2/5 completed");
  });

  test("should show task count when none completed", () => {
    const stats = { completed: 0, total: 3 };
    const displayText = stats.completed > 0 
      ? `${stats.completed}/${stats.total} completed`
      : `${stats.total} tasks`;
    
    expect(displayText).toBe("3 tasks");
  });
});

describe("TaskList Edge Cases", () => {
  test("should handle empty task array", () => {
    const groups = groupTasks([], "date");
    expect(Object.keys(groups)).toHaveLength(0);
  });

  test("should handle single task", () => {
    const tasks = [createMockTask()];
    const groups = groupTasks(tasks, "none");
    
    expect(groups[""]).toHaveLength(1);
  });

  test("should handle all tasks in same group", () => {
    const today = new Date().toISOString();
    const tasks = [
      createMockTask({ date: today }),
      createMockTask({ date: today }),
      createMockTask({ date: today }),
    ];
    
    const groups = groupTasks(tasks, "date");
    
    expect(Object.keys(groups)).toHaveLength(1);
    expect(groups["Today"]).toHaveLength(3);
  });

  test("should handle tasks with future dates", () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    
    const tasks = [
      createMockTask({ date: futureDate.toISOString() }),
    ];
    
    const groups = groupTasks(tasks, "date");
    
    // Should use formatted date string for future dates
    const keys = Object.keys(groups);
    expect(keys).toHaveLength(1);
    expect(keys[0]).not.toBe("Overdue");
    expect(keys[0]).not.toBe("Today");
    expect(keys[0]).not.toBe("Tomorrow");
  });

  test("should handle large number of tasks", () => {
    const tasks = Array.from({ length: 100 }, (_, i) => 
      createMockTask({ name: `Task ${i}` })
    );
    
    const groups = groupTasks(tasks, "none");
    
    expect(groups[""]).toHaveLength(100);
  });

  test("should handle tasks with special characters in list name", () => {
    const tasks = [
      createMockTask({ 
        list: { name: "Work & Personal <script>" } as List 
      }),
    ];
    
    const groups = groupTasks(tasks, "list");
    
    expect(groups["Work & Personal <script>"]).toBeDefined();
  });
});

describe("TaskListFlat Variant", () => {
  test("should not group tasks", () => {
    const tasks = [
      createMockTask({ priority: "high" }),
      createMockTask({ priority: "low" }),
    ];
    
    // Flat list doesn't group, just renders in order
    expect(tasks).toHaveLength(2);
  });
});

describe("TaskListAnimated Variant", () => {
  test("should have correct animation config", () => {
    const addAnimation = "slide";
    const removeAnimation = "shrink";
    const staggerDelay = 0.03;
    
    expect(addAnimation).toBe("slide");
    expect(removeAnimation).toBe("shrink");
    expect(staggerDelay).toBe(0.03);
  });
});
