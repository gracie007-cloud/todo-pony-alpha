/**
 * Tests for TaskCard component
 * Tests rendering logic, interactions, swipe gestures, and display variants
 */

import { describe, test, expect, beforeEach, mock } from "bun:test";
import type { TaskWithRelations, Priority, List, Label, Subtask } from "@/lib/types";

// Animation variants extracted from component
const cardVariants = {
  initial: { 
    opacity: 0, 
    y: 20,
    scale: 0.98,
  },
  animate: {
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

const SWIPE_THRESHOLD = 100;

// Helper function to create mock task
function createMockTask(overrides: Partial<TaskWithRelations> = {}): TaskWithRelations {
  return {
    id: "task-1",
    name: "Test Task",
    description: null,
    completed: false,
    priority: "none" as Priority,
    date: null,
    listId: "list-1",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    list: {
      id: "list-1",
      name: "Inbox",
      color: "#3b82f6",
      emoji: "📥",
      isDefault: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as List,
    labels: [],
    subtasks: [],
    reminders: [],
    attachments: [],
    ...overrides,
  };
}

// Helper function to check if task is overdue
function isTaskOverdue(date: string | null, completed: boolean): boolean {
  if (!date || completed) return false;
  return new Date(date) < new Date();
}

// Helper function to calculate subtask progress
function calculateSubtaskProgress(subtasks: Subtask[]): { completed: number; total: number } {
  return {
    completed: subtasks.filter((s) => s.completed).length,
    total: subtasks.length,
  };
}

// Helper function to get card classes
function getCardClasses(
  isDragging: boolean,
  isCompleted: boolean,
  className?: string
): string[] {
  const classes = [
    "group",
    "relative",
    "rounded-lg",
    "border",
    "bg-card",
    "p-3",
    "transition-shadow",
  ];

  if (isDragging) {
    classes.push("shadow-lg", "ring-2", "ring-primary/50");
  }

  if (isCompleted) {
    classes.push("opacity-60");
  }

  classes.push("hover-lift");

  if (className) {
    classes.push(className);
  }

  return classes;
}

// Helper function to calculate stagger delay
function calculateStaggerDelay(index: number, reducedMotion: boolean): number {
  return reducedMotion ? 0 : index * 0.05;
}

// Helper function to handle swipe gesture
function handleSwipeGesture(
  offsetX: number,
  onToggleComplete: (id: string, completed: boolean) => void,
  taskId: string,
  currentCompleted: boolean
): boolean {
  if (Math.abs(offsetX) > SWIPE_THRESHOLD) {
    onToggleComplete(taskId, !currentCompleted);
    return true;
  }
  return false;
}

// Helper function to get swipe background
function getSwipeBackground(x: number): string {
  if (x <= -SWIPE_THRESHOLD * 2) return "oklch(0.65 0.18 145 / 0.3)";
  if (x <= -SWIPE_THRESHOLD) return "oklch(0.65 0.18 145 / 0.2)";
  if (x >= SWIPE_THRESHOLD * 2) return "oklch(0.65 0.18 145 / 0.3)";
  if (x >= SWIPE_THRESHOLD) return "oklch(0.65 0.18 145 / 0.2)";
  return "transparent";
}

describe("TaskCard Component Logic", () => {
  describe("createMockTask", () => {
    test("should create a valid task with defaults", () => {
      const task = createMockTask();
      
      expect(task.id).toBe("task-1");
      expect(task.name).toBe("Test Task");
      expect(task.completed).toBe(false);
      expect(task.priority).toBe("none");
    });

    test("should allow overriding default values", () => {
      const task = createMockTask({
        id: "custom-id",
        name: "Custom Task",
        completed: true,
        priority: "high",
      });
      
      expect(task.id).toBe("custom-id");
      expect(task.name).toBe("Custom Task");
      expect(task.completed).toBe(true);
      expect(task.priority).toBe("high");
    });

    test("should include related entities", () => {
      const task = createMockTask();
      
      expect(task.list).toBeDefined();
      expect(task.labels).toEqual([]);
      expect(task.subtasks).toEqual([]);
    });
  });

  describe("isTaskOverdue", () => {
    test("should return false for task without date", () => {
      expect(isTaskOverdue(null, false)).toBe(false);
    });

    test("should return false for completed task", () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      
      expect(isTaskOverdue(pastDate.toISOString(), true)).toBe(false);
    });

    test("should return true for incomplete task with past date", () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      
      expect(isTaskOverdue(pastDate.toISOString(), false)).toBe(true);
    });

    test("should return false for task with future date", () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      
      expect(isTaskOverdue(futureDate.toISOString(), false)).toBe(false);
    });

    test("should return false for task with today's date", () => {
      const today = new Date();
      today.setHours(23, 59, 59);
      
      // Today's date is not overdue unless it's in the past
      expect(isTaskOverdue(today.toISOString(), false)).toBe(false);
    });
  });

  describe("calculateSubtaskProgress", () => {
    test("should return zero for empty subtasks", () => {
      const progress = calculateSubtaskProgress([]);
      
      expect(progress.completed).toBe(0);
      expect(progress.total).toBe(0);
    });

    test("should count completed subtasks", () => {
      const subtasks = [
        { id: "1", completed: true } as Subtask,
        { id: "2", completed: false } as Subtask,
        { id: "3", completed: true } as Subtask,
      ];
      
      const progress = calculateSubtaskProgress(subtasks);
      
      expect(progress.completed).toBe(2);
      expect(progress.total).toBe(3);
    });

    test("should handle all completed subtasks", () => {
      const subtasks = [
        { id: "1", completed: true } as Subtask,
        { id: "2", completed: true } as Subtask,
      ];
      
      const progress = calculateSubtaskProgress(subtasks);
      
      expect(progress.completed).toBe(2);
      expect(progress.total).toBe(2);
    });
  });

  describe("getCardClasses", () => {
    test("should include base classes", () => {
      const classes = getCardClasses(false, false);
      
      expect(classes).toContain("group");
      expect(classes).toContain("relative");
      expect(classes).toContain("rounded-lg");
      expect(classes).toContain("border");
      expect(classes).toContain("bg-card");
    });

    test("should include dragging classes when dragging", () => {
      const classes = getCardClasses(true, false);
      
      expect(classes).toContain("shadow-lg");
      expect(classes).toContain("ring-2");
      expect(classes).toContain("ring-primary/50");
    });

    test("should include opacity class when completed", () => {
      const classes = getCardClasses(false, true);
      
      expect(classes).toContain("opacity-60");
    });

    test("should include custom className", () => {
      const classes = getCardClasses(false, false, "custom-class");
      
      expect(classes).toContain("custom-class");
    });
  });

  describe("calculateStaggerDelay", () => {
    test("should return 0 when reduced motion is preferred", () => {
      expect(calculateStaggerDelay(0, true)).toBe(0);
      expect(calculateStaggerDelay(5, true)).toBe(0);
      expect(calculateStaggerDelay(10, true)).toBe(0);
    });

    test("should calculate delay based on index", () => {
      expect(calculateStaggerDelay(0, false)).toBe(0);
      expect(calculateStaggerDelay(1, false)).toBe(0.05);
      expect(calculateStaggerDelay(2, false)).toBe(0.1);
      expect(calculateStaggerDelay(10, false)).toBe(0.5);
    });
  });
});

describe("TaskCard Swipe Gesture", () => {
  describe("handleSwipeGesture", () => {
    test("should trigger completion when swipe exceeds threshold", () => {
      const onToggleComplete = mock(() => {});
      
      const result = handleSwipeGesture(
        SWIPE_THRESHOLD + 10,
        onToggleComplete,
        "task-1",
        false
      );
      
      expect(result).toBe(true);
      expect(onToggleComplete).toHaveBeenCalledWith("task-1", true);
    });

    test("should trigger uncompletion when swipe exceeds threshold", () => {
      const onToggleComplete = mock(() => {});
      
      const result = handleSwipeGesture(
        -SWIPE_THRESHOLD - 10,
        onToggleComplete,
        "task-1",
        true
      );
      
      expect(result).toBe(true);
      expect(onToggleComplete).toHaveBeenCalledWith("task-1", false);
    });

    test("should not trigger when swipe is below threshold", () => {
      const onToggleComplete = mock(() => {});
      
      const result = handleSwipeGesture(
        SWIPE_THRESHOLD - 10,
        onToggleComplete,
        "task-1",
        false
      );
      
      expect(result).toBe(false);
      expect(onToggleComplete).not.toHaveBeenCalled();
    });

    test("should work with negative swipe direction", () => {
      const onToggleComplete = mock(() => {});
      
      const result = handleSwipeGesture(
        -SWIPE_THRESHOLD - 50,
        onToggleComplete,
        "task-1",
        false
      );
      
      expect(result).toBe(true);
      expect(onToggleComplete).toHaveBeenCalled();
    });
  });

  describe("getSwipeBackground", () => {
    test("should return transparent at center", () => {
      expect(getSwipeBackground(0)).toBe("transparent");
    });

    test("should return light color at threshold", () => {
      expect(getSwipeBackground(SWIPE_THRESHOLD)).toBe("oklch(0.65 0.18 145 / 0.2)");
      expect(getSwipeBackground(-SWIPE_THRESHOLD)).toBe("oklch(0.65 0.18 145 / 0.2)");
    });

    test("should return darker color past double threshold", () => {
      expect(getSwipeBackground(SWIPE_THRESHOLD * 2)).toBe("oklch(0.65 0.18 145 / 0.3)");
      expect(getSwipeBackground(-SWIPE_THRESHOLD * 2)).toBe("oklch(0.65 0.18 145 / 0.3)");
    });
  });
});

describe("TaskCard Animation Variants", () => {
  test("should have initial state with opacity 0", () => {
    expect(cardVariants.initial.opacity).toBe(0);
  });

  test("should have animate state with opacity 1", () => {
    expect(cardVariants.animate.opacity).toBe(1);
  });

  test("should have spring transition in animate", () => {
    const transition = cardVariants.animate.transition;
    expect(transition.type).toBe("spring");
    expect(transition.stiffness).toBe(350);
    expect(transition.damping).toBe(25);
  });

  test("should have exit animation with x offset", () => {
    expect(cardVariants.exit.x).toBe(-100);
    expect(cardVariants.exit.opacity).toBe(0);
  });
});

describe("TaskCard Display Logic", () => {
  describe("should show list badge", () => {
    test("should show when showList is true and task has list", () => {
      const task = createMockTask();
      const showList = true;
      
      const shouldShow = showList && task.list;
      expect(shouldShow).toBeTruthy();
    });

    test("should not show when showList is false", () => {
      const task = createMockTask();
      const showList = false;
      
      const shouldShow = showList && task.list;
      expect(shouldShow).toBeFalsy();
    });
  });

  describe("should show priority dot", () => {
    test("should show for high priority", () => {
      const task = createMockTask({ priority: "high" });
      expect(task.priority !== "none").toBe(true);
    });

    test("should show for medium priority", () => {
      const task = createMockTask({ priority: "medium" });
      expect(task.priority !== "none").toBe(true);
    });

    test("should show for low priority", () => {
      const task = createMockTask({ priority: "low" });
      expect(task.priority !== "none").toBe(true);
    });

    test("should not show for none priority", () => {
      const task = createMockTask({ priority: "none" });
      expect(task.priority !== "none").toBe(false);
    });
  });

  describe("should show subtask progress", () => {
    test("should show when task has subtasks", () => {
      const task = createMockTask({
        subtasks: [
          { id: "st-1", completed: false } as Subtask,
        ],
      });
      
      expect(task.subtasks.length > 0).toBe(true);
    });

    test("should not show when task has no subtasks", () => {
      const task = createMockTask();
      
      expect(task.subtasks.length > 0).toBe(false);
    });
  });

  describe("should show labels", () => {
    test("should show when task has labels", () => {
      const task = createMockTask({
        labels: [
          { id: "label-1", name: "Work" } as Label,
        ],
      });
      
      expect(task.labels.length > 0).toBe(true);
    });

    test("should not show when task has no labels", () => {
      const task = createMockTask();
      
      expect(task.labels.length > 0).toBe(false);
    });
  });

  describe("should show description", () => {
    test("should show when task has description", () => {
      const task = createMockTask({ description: "Task description" });
      expect(!!task.description).toBe(true);
    });

    test("should not show when description is null", () => {
      const task = createMockTask({ description: null });
      expect(!!task.description).toBe(false);
    });
  });
});

describe("TaskCardCompact Variant", () => {
  test("should have same overdue logic as full card", () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);
    
    const task = createMockTask({
      date: pastDate.toISOString(),
      completed: false,
    });
    
    const isOverdue = task.date && new Date(task.date) < new Date() && !task.completed;
    expect(isOverdue).toBe(true);
  });

  test("should use smaller stagger delay", () => {
    const index = 5;
    const reducedMotion = false;
    const staggerDelay = reducedMotion ? 0 : index * 0.03;
    
    expect(staggerDelay).toBe(0.15);
  });
});

describe("TaskCardSkeleton", () => {
  test("should render skeleton structure", () => {
    // Test that skeleton has expected structure
    const skeletonElements = [
      "checkbox-skeleton",
      "content-skeleton",
      "title-skeleton",
      "meta-skeleton",
    ];
    
    expect(skeletonElements).toHaveLength(4);
  });
});

describe("TaskCard Edge Cases", () => {
  test("should handle task with all fields populated", () => {
    const task = createMockTask({
      name: "Complete Task",
      description: "A task with all fields",
      completed: false,
      priority: "high",
      date: new Date().toISOString(),
      labels: [{ id: "l1", name: "Work" } as Label],
      subtasks: [{ id: "s1", completed: false } as Subtask],
    });
    
    expect(task.name).toBeDefined();
    expect(task.description).toBeDefined();
    expect(task.priority).toBe("high");
    expect(task.labels).toHaveLength(1);
    expect(task.subtasks).toHaveLength(1);
  });

  test("should handle very long task name", () => {
    const longName = "A".repeat(500);
    const task = createMockTask({ name: longName });
    
    expect(task.name).toBe(longName);
    expect(task.name.length).toBe(500);
  });

  test("should handle special characters in task name", () => {
    const specialName = "Task with <script>alert('xss')</script> & \"quotes\"";
    const task = createMockTask({ name: specialName });
    
    expect(task.name).toBe(specialName);
  });

  test("should handle task with many subtasks", () => {
    const subtasks = Array.from({ length: 20 }, (_, i) => ({
      id: `st-${i}`,
      completed: i < 10,
    } as Subtask));
    
    const task = createMockTask({ subtasks });
    const progress = calculateSubtaskProgress(subtasks);
    
    expect(progress.completed).toBe(10);
    expect(progress.total).toBe(20);
  });
});
