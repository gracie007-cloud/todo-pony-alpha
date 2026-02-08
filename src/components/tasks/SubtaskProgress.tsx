"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SubtaskProgressProps {
  completed: number;
  total: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

const sizeConfig = {
  sm: {
    height: "h-1",
    text: "text-[10px]",
    gap: "gap-1",
  },
  md: {
    height: "h-1.5",
    text: "text-xs",
    gap: "gap-1.5",
  },
  lg: {
    height: "h-2",
    text: "text-sm",
    gap: "gap-2",
  },
};

export function SubtaskProgress({
  completed,
  total,
  size = "md",
  showLabel = true,
  className,
}: SubtaskProgressProps) {
  if (total === 0) return null;

  const percentage = (completed / total) * 100;
  const isComplete = completed === total;
  const config = sizeConfig[size];

  return (
    <div className={cn("flex items-center", config.gap, className)}>
      {/* Progress bar */}
      <div className={cn("flex-1 rounded-full bg-muted overflow-hidden", config.height)}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className={cn(
            "h-full rounded-full transition-colors",
            isComplete ? "bg-success" : "bg-primary"
          )}
        />
      </div>

      {/* Label */}
      {showLabel && (
        <span
          className={cn(
            "tabular-nums text-muted-foreground",
            config.text
          )}
        >
          {completed}/{total}
        </span>
      )}
    </div>
  );
}

// Circular progress indicator
export function SubtaskProgressCircle({
  completed,
  total,
  size = "md",
  className,
}: {
  completed: number;
  total: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  if (total === 0) return null;

  const percentage = (completed / total) * 100;
  const isComplete = completed === total;

  const sizeConfig = {
    sm: { container: "size-4", stroke: 2, font: "text-[8px]" },
    md: { container: "size-5", stroke: 2.5, font: "text-[10px]" },
    lg: { container: "size-6", stroke: 3, font: "text-xs" },
  };

  const config = sizeConfig[size];
  const radius = (parseInt(config.container.split("-")[1]) - config.stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className={cn("relative", config.container, className)}>
      <svg className="size-full -rotate-90" viewBox="0 0 20 20">
        {/* Background circle */}
        <circle
          cx="10"
          cy="10"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={config.stroke}
          className="text-muted"
        />
        {/* Progress circle */}
        <motion.circle
          cx="10"
          cy="10"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={config.stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className={isComplete ? "text-success" : "text-primary"}
        />
      </svg>
      
      {/* Center text */}
      {size !== "sm" && (
        <span
          className={cn(
            "absolute inset-0 flex items-center justify-center font-medium",
            config.font,
            isComplete ? "text-success" : "text-foreground"
          )}
        >
          {isComplete ? "✓" : completed}
        </span>
      )}
    </div>
  );
}

// Mini progress bar for task cards
export function SubtaskMiniProgress({
  completed,
  total,
  className,
}: {
  completed: number;
  total: number;
  className?: string;
}) {
  if (total === 0) return null;

  const percentage = (completed / total) * 100;
  const isComplete = completed === total;

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      {/* Segmented progress */}
      <div className="flex gap-0.5">
        {Array.from({ length: Math.min(total, 5) }).map((_, i) => {
          const isCompleted = i < Math.min(completed, 5);
          const isPartial = i === Math.min(completed, 5) && completed % 1 !== 0;
          
          return (
            <motion.div
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className={cn(
                "size-1.5 rounded-full",
                isCompleted
                  ? isComplete
                    ? "bg-success"
                    : "bg-primary"
                  : isPartial
                  ? "bg-primary/50"
                  : "bg-muted"
              )}
            />
          );
        })}
        {total > 5 && (
          <span className="text-[10px] text-muted-foreground ml-0.5">
            +{total - 5}
          </span>
        )}
      </div>
    </div>
  );
}

// Checklist style subtask display
export function SubtaskChecklist({
  subtasks,
  onToggle,
  maxVisible = 3,
  className,
}: {
  subtasks: Array<{ id: string; name: string; completed: boolean }>;
  onToggle?: (id: string) => void;
  maxVisible?: number;
  className?: string;
}) {
  if (!subtasks.length) return null;

  const visibleSubtasks = subtasks.slice(0, maxVisible);
  const remainingCount = subtasks.length - maxVisible;

  return (
    <div className={cn("space-y-1", className)}>
      {visibleSubtasks.map((subtask) => (
        <motion.button
          key={subtask.id}
          type="button"
          onClick={() => onToggle?.(subtask.id)}
          whileHover={{ x: 2 }}
          className={cn(
            "flex items-center gap-2 w-full text-left text-xs",
            subtask.completed ? "text-muted-foreground" : "text-foreground"
          )}
        >
          <div
            className={cn(
              "size-3 rounded-sm border flex items-center justify-center transition-colors",
              subtask.completed
                ? "bg-primary border-primary text-primary-foreground"
                : "border-muted-foreground/30"
            )}
          >
            {subtask.completed && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-[8px]"
              >
                ✓
              </motion.span>
            )}
          </div>
          <span className={subtask.completed ? "line-through" : ""}>
            {subtask.name}
          </span>
        </motion.button>
      ))}
      {remainingCount > 0 && (
        <span className="text-xs text-muted-foreground pl-5">
          +{remainingCount} more
        </span>
      )}
    </div>
  );
}
