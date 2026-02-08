"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Priority } from "@/lib/types";

interface PriorityBadgeProps {
  priority: Priority;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

const priorityConfig = {
  high: {
    label: "High",
    icon: ArrowUp,
    color: "text-priority-high",
    bgColor: "bg-priority-high/10",
    borderColor: "border-priority-high/20",
  },
  medium: {
    label: "Medium",
    icon: ArrowUp,
    color: "text-priority-medium",
    bgColor: "bg-priority-medium/10",
    borderColor: "border-priority-medium/20",
  },
  low: {
    label: "Low",
    icon: ArrowDown,
    color: "text-priority-low",
    bgColor: "bg-priority-low/10",
    borderColor: "border-priority-low/20",
  },
  none: {
    label: "None",
    icon: Minus,
    color: "text-priority-none",
    bgColor: "bg-priority-none/10",
    borderColor: "border-priority-none/20",
  },
};

const sizeConfig = {
  sm: {
    container: "px-1.5 py-0.5 text-[10px] gap-0.5",
    icon: "size-2.5",
  },
  md: {
    container: "px-2 py-0.5 text-xs gap-1",
    icon: "size-3",
  },
  lg: {
    container: "px-2.5 py-1 text-sm gap-1",
    icon: "size-3.5",
  },
};

export function PriorityBadge({
  priority,
  size = "md",
  showLabel = true,
  className,
}: PriorityBadgeProps) {
  const config = priorityConfig[priority];
  const sizes = sizeConfig[size];
  const Icon = config.icon;

  if (priority === "none" && !showLabel) {
    return null;
  }

  return (
    <motion.span
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={cn(
        "inline-flex items-center rounded-md border font-medium",
        sizes.container,
        config.color,
        config.bgColor,
        config.borderColor,
        className
      )}
    >
      <Icon className={cn("stroke-[2.5]", sizes.icon)} />
      {showLabel && <span>{config.label}</span>}
    </motion.span>
  );
}

// Compact dot indicator
export function PriorityDot({
  priority,
  size = "md",
  className,
}: {
  priority: Priority;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  if (priority === "none") return null;

  const sizeClasses = {
    sm: "size-1.5",
    md: "size-2",
    lg: "size-2.5",
  };

  const colorClasses = {
    high: "bg-priority-high",
    medium: "bg-priority-medium",
    low: "bg-priority-low",
    none: "bg-priority-none",
  };

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className={cn(
        "rounded-full flex-shrink-0",
        sizeClasses[size],
        colorClasses[priority],
        className
      )}
      title={priorityConfig[priority].label}
    />
  );
}

// Priority flag icon
export function PriorityFlag({
  priority,
  size = "md",
  className,
}: {
  priority: Priority;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  if (priority === "none") return null;

  const sizeClasses = {
    sm: "size-3",
    md: "size-3.5",
    lg: "size-4",
  };

  const colorClasses = {
    high: "text-priority-high",
    medium: "text-priority-medium",
    low: "text-priority-low",
    none: "text-priority-none",
  };

  return (
    <motion.div
      initial={{ scale: 0, rotate: -45 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 500, damping: 25 }}
      className={cn(sizeClasses[size], colorClasses[priority], className)}
    >
      <ArrowUp className="size-full stroke-[2.5]" />
    </motion.div>
  );
}

// Priority selector buttons
export function PrioritySelector({
  value,
  onChange,
  size = "md",
  className,
}: {
  value: Priority;
  onChange: (priority: Priority) => void;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const priorities: Priority[] = ["high", "medium", "low", "none"];

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {priorities.map((priority) => {
        const config = priorityConfig[priority];
        const isActive = value === priority;
        const sizes = sizeConfig[size];

        return (
          <motion.button
            key={priority}
            type="button"
            onClick={() => onChange(priority)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={cn(
              "inline-flex items-center rounded-md border transition-all",
              sizes.container,
              isActive
                ? cn(config.color, config.bgColor, config.borderColor)
                : "text-muted-foreground border-transparent hover:bg-accent"
            )}
          >
            <config.icon className={cn("stroke-[2.5]", sizes.icon)} />
            <span>{config.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
