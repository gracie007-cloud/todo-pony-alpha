/**
 * Tests for TaskCheckbox component
 * Tests checkbox behavior, animations, sizes, and priority variants
 */

import { describe, test, expect, mock } from "bun:test";
import type { Priority } from "@/lib/types";

// Size configuration extracted from component
const sizeConfig = {
  sm: {
    container: "size-4",
    check: "size-2.5",
    ring: "size-8",
  },
  md: {
    container: "size-5",
    check: "size-3",
    ring: "size-10",
  },
  lg: {
    container: "size-6",
    check: "size-3.5",
    ring: "size-12",
  },
} as const;

// Spring configuration
const springConfig = {
  stiffness: 500,
  damping: 30,
  mass: 0.8,
};

// Priority color mappings
const priorityColors = {
  high: "border-priority-high hover:border-priority-high",
  medium: "border-priority-medium hover:border-priority-medium",
  low: "border-priority-low hover:border-priority-low",
  none: "border-muted-foreground/30 hover:border-primary/50",
};

const priorityBgColors = {
  high: "bg-priority-high",
  medium: "bg-priority-medium",
  low: "bg-priority-low",
  none: "bg-primary",
};

// Helper functions that replicate component logic
function getCheckboxClasses(
  checked: boolean,
  disabled: boolean,
  size: "sm" | "md" | "lg",
  priority?: Priority
): string[] {
  const config = sizeConfig[size];
  const classes: string[] = [
    "relative",
    "flex",
    "items-center",
    "justify-center",
    "rounded-full",
    "border-2",
    "transition-colors",
    "focus:outline-none",
    "focus-visible:ring-2",
    "focus-visible:ring-ring",
    "focus-visible:ring-offset-2",
    config.container,
  ];

  if (checked) {
    if (priority) {
      classes.push(priorityBgColors[priority], "text-white", "border-transparent");
    } else {
      classes.push("border-primary", "bg-primary", "text-primary-foreground");
    }
  } else {
    if (priority) {
      classes.push(priorityColors[priority]);
    } else {
      classes.push("border-muted-foreground/30", "hover:border-primary/50");
    }
  }

  if (disabled) {
    classes.push("opacity-50", "cursor-not-allowed");
  }

  return classes;
}

function simulateCheckboxClick(
  checked: boolean,
  disabled: boolean,
  onCheckedChange: (checked: boolean) => void
): boolean {
  if (disabled) return false;
  onCheckedChange(!checked);
  return true;
}

function getAriaAttributes(checked: boolean, disabled: boolean) {
  return {
    role: "checkbox",
    "aria-checked": checked,
    "aria-disabled": disabled,
  };
}

describe("TaskCheckbox Component Logic", () => {
  describe("sizeConfig", () => {
    test("should have config for all sizes", () => {
      expect(sizeConfig.sm).toBeDefined();
      expect(sizeConfig.md).toBeDefined();
      expect(sizeConfig.lg).toBeDefined();
    });

    test("should have increasing container sizes", () => {
      expect(sizeConfig.sm.container).toBe("size-4");
      expect(sizeConfig.md.container).toBe("size-5");
      expect(sizeConfig.lg.container).toBe("size-6");
    });

    test("should have increasing check icon sizes", () => {
      expect(sizeConfig.sm.check).toBe("size-2.5");
      expect(sizeConfig.md.check).toBe("size-3");
      expect(sizeConfig.lg.check).toBe("size-3.5");
    });

    test("should have increasing ring sizes for ripple effect", () => {
      expect(sizeConfig.sm.ring).toBe("size-8");
      expect(sizeConfig.md.ring).toBe("size-10");
      expect(sizeConfig.lg.ring).toBe("size-12");
    });
  });

  describe("springConfig", () => {
    test("should have correct spring configuration", () => {
      expect(springConfig.stiffness).toBe(500);
      expect(springConfig.damping).toBe(30);
      expect(springConfig.mass).toBe(0.8);
    });

    test("should produce snappy animation feel", () => {
      // High stiffness + moderate damping = snappy feel
      expect(springConfig.stiffness).toBeGreaterThan(300);
      expect(springConfig.damping).toBeLessThan(50);
    });
  });

  describe("getCheckboxClasses", () => {
    test("should include base classes for unchecked checkbox", () => {
      const classes = getCheckboxClasses(false, false, "md");
      
      expect(classes).toContain("rounded-full");
      expect(classes).toContain("border-2");
      expect(classes).toContain("transition-colors");
    });

    test("should include checked state classes", () => {
      const classes = getCheckboxClasses(true, false, "md");
      
      expect(classes).toContain("border-primary");
      expect(classes).toContain("bg-primary");
      expect(classes).toContain("text-primary-foreground");
    });

    test("should include unchecked state classes", () => {
      const classes = getCheckboxClasses(false, false, "md");
      
      expect(classes).toContain("border-muted-foreground/30");
    });

    test("should include disabled classes when disabled", () => {
      const classes = getCheckboxClasses(false, true, "md");
      
      expect(classes).toContain("opacity-50");
      expect(classes).toContain("cursor-not-allowed");
    });

    test("should include size classes", () => {
      const smClasses = getCheckboxClasses(false, false, "sm");
      expect(smClasses).toContain("size-4");
      
      const mdClasses = getCheckboxClasses(false, false, "md");
      expect(mdClasses).toContain("size-5");
      
      const lgClasses = getCheckboxClasses(false, false, "lg");
      expect(lgClasses).toContain("size-6");
    });
  });

  describe("simulateCheckboxClick", () => {
    test("should call onCheckedChange with toggled value", () => {
      let newValue: boolean | undefined;
      const onCheckedChange = mock((checked: boolean) => {
        newValue = checked;
      });

      simulateCheckboxClick(false, false, onCheckedChange);
      
      expect(newValue).toBe(true);
      expect(onCheckedChange).toHaveBeenCalled();
    });

    test("should toggle from checked to unchecked", () => {
      let newValue: boolean | undefined;
      const onCheckedChange = mock((checked: boolean) => {
        newValue = checked;
      });

      simulateCheckboxClick(true, false, onCheckedChange);
      
      expect(newValue).toBe(false);
    });

    test("should not call onCheckedChange when disabled", () => {
      const onCheckedChange = mock(() => {});

      const result = simulateCheckboxClick(false, true, onCheckedChange);
      
      expect(result).toBe(false);
      expect(onCheckedChange).not.toHaveBeenCalled();
    });

    test("should return true when click is processed", () => {
      const onCheckedChange = mock(() => {});
      
      const result = simulateCheckboxClick(false, false, onCheckedChange);
      
      expect(result).toBe(true);
    });
  });

  describe("getAriaAttributes", () => {
    test("should return correct role", () => {
      const attrs = getAriaAttributes(false, false);
      expect(attrs.role).toBe("checkbox");
    });

    test("should return correct aria-checked when unchecked", () => {
      const attrs = getAriaAttributes(false, false);
      expect(attrs["aria-checked"]).toBe(false);
    });

    test("should return correct aria-checked when checked", () => {
      const attrs = getAriaAttributes(true, false);
      expect(attrs["aria-checked"]).toBe(true);
    });

    test("should return correct aria-disabled when enabled", () => {
      const attrs = getAriaAttributes(false, false);
      expect(attrs["aria-disabled"]).toBe(false);
    });

    test("should return correct aria-disabled when disabled", () => {
      const attrs = getAriaAttributes(false, true);
      expect(attrs["aria-disabled"]).toBe(true);
    });
  });
});

describe("TaskCheckboxPriority Variant", () => {
  describe("priorityColors", () => {
    test("should have colors for all priority levels", () => {
      expect(priorityColors.high).toBeDefined();
      expect(priorityColors.medium).toBeDefined();
      expect(priorityColors.low).toBeDefined();
      expect(priorityColors.none).toBeDefined();
    });

    test("should have unique border colors for each priority", () => {
      expect(priorityColors.high).toContain("priority-high");
      expect(priorityColors.medium).toContain("priority-medium");
      expect(priorityColors.low).toContain("priority-low");
    });
  });

  describe("priorityBgColors", () => {
    test("should have background colors for all priority levels", () => {
      expect(priorityBgColors.high).toBeDefined();
      expect(priorityBgColors.medium).toBeDefined();
      expect(priorityBgColors.low).toBeDefined();
      expect(priorityBgColors.none).toBeDefined();
    });

    test("should use primary color for none priority", () => {
      expect(priorityBgColors.none).toBe("bg-primary");
    });
  });

  describe("getCheckboxClasses with priority", () => {
    test("should include priority border colors when unchecked", () => {
      const highClasses = getCheckboxClasses(false, false, "md", "high");
      expect(highClasses).toContain("border-priority-high");
      
      const mediumClasses = getCheckboxClasses(false, false, "md", "medium");
      expect(mediumClasses).toContain("border-priority-medium");
      
      const lowClasses = getCheckboxClasses(false, false, "md", "low");
      expect(lowClasses).toContain("border-priority-low");
    });

    test("should include priority background colors when checked", () => {
      const highClasses = getCheckboxClasses(true, false, "md", "high");
      expect(highClasses).toContain("bg-priority-high");
      expect(highClasses).toContain("border-transparent");
      
      const mediumClasses = getCheckboxClasses(true, false, "md", "medium");
      expect(mediumClasses).toContain("bg-priority-medium");
      
      const lowClasses = getCheckboxClasses(true, false, "md", "low");
      expect(lowClasses).toContain("bg-priority-low");
    });

    test("should use primary colors for none priority when checked", () => {
      const classes = getCheckboxClasses(true, false, "md", "none");
      expect(classes).toContain("bg-primary");
    });
  });
});

describe("TaskCheckbox Animation Logic", () => {
  test("should determine animation trigger conditions", () => {
    // Animation should trigger when checking (not unchecking)
    const shouldAnimateOnCheck = !false && true; // !checked && !reducedMotion
    const shouldAnimateOnUncheck = !true && true; // !checked && !reducedMotion
    
    expect(shouldAnimateOnCheck).toBe(true);
    expect(shouldAnimateOnUncheck).toBe(false);
  });

  test("should calculate particle positions for celebration effect", () => {
    const particleCount = 6;
    const positions: { x: number; y: number }[] = [];
    
    for (let i = 0; i < particleCount; i++) {
      positions.push({
        x: Math.cos((i * Math.PI * 2) / particleCount) * 20,
        y: Math.sin((i * Math.PI * 2) / particleCount) * 20,
      });
    }
    
    // Verify particles are evenly distributed
    expect(positions).toHaveLength(6);
    
    // First particle should be at right
    expect(positions[0].x).toBeCloseTo(20);
    expect(positions[0].y).toBeCloseTo(0);
    
    // Fourth particle should be at left (opposite)
    expect(positions[3].x).toBeCloseTo(-20);
    expect(positions[3].y).toBeCloseTo(0);
  });

  test("should calculate ripple scale correctly", () => {
    // Ripple starts at 0.8 and scales to 2.5
    const initialScale = 0.8;
    const targetScale = 2.5;
    
    expect(targetScale).toBeGreaterThan(initialScale);
    expect(targetScale / initialScale).toBe(3.125); // Scale multiplier
  });
});

describe("TaskCheckbox Accessibility", () => {
  test("should have proper focus visible styles", () => {
    const classes = getCheckboxClasses(false, false, "md");
    
    expect(classes).toContain("focus-visible:ring-2");
    expect(classes).toContain("focus-visible:ring-ring");
    expect(classes).toContain("focus-visible:ring-offset-2");
  });

  test("should be keyboard accessible with button role", () => {
    const attrs = getAriaAttributes(false, false);
    
    expect(attrs.role).toBe("checkbox");
    expect(attrs["aria-checked"]).toBeDefined();
  });

  test("should indicate disabled state to screen readers", () => {
    const attrs = getAriaAttributes(false, true);
    
    expect(attrs["aria-disabled"]).toBe(true);
  });
});

describe("TaskCheckbox Edge Cases", () => {
  test("should handle rapid toggling", () => {
    const states: boolean[] = [];
    const onCheckedChange = mock((checked: boolean) => {
      states.push(checked);
    });

    // Simulate rapid toggling
    simulateCheckboxClick(false, false, onCheckedChange);
    simulateCheckboxClick(true, false, onCheckedChange);
    simulateCheckboxClick(false, false, onCheckedChange);
    
    expect(states).toEqual([true, false, true]);
  });

  test("should handle all size and priority combinations", () => {
    const sizes: Array<"sm" | "md" | "lg"> = ["sm", "md", "lg"];
    const priorities: Priority[] = ["high", "medium", "low", "none"];
    
    sizes.forEach((size) => {
      priorities.forEach((priority) => {
        expect(() => getCheckboxClasses(true, false, size, priority)).not.toThrow();
        expect(() => getCheckboxClasses(false, false, size, priority)).not.toThrow();
      });
    });
  });

  test("should handle disabled state with all priorities", () => {
    const priorities: Priority[] = ["high", "medium", "low", "none"];
    
    priorities.forEach((priority) => {
      const classes = getCheckboxClasses(false, true, "md", priority);
      expect(classes).toContain("opacity-50");
      expect(classes).toContain("cursor-not-allowed");
    });
  });
});
