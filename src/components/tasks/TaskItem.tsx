"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { TaskCheckboxPriority } from "./TaskCheckbox";
import { PriorityDot } from "./PriorityBadge";
import { TaskDueDate } from "./TaskDueDate";
import { TaskLabelDots } from "./TaskLabels";
import type { TaskWithRelations, List, Label } from "@/lib/types";

interface TaskItemProps {
  task: TaskWithRelations;
  list?: List;
  labels?: Label[];
  subtaskCount?: number;
  completedSubtasks?: number;
  onToggleComplete?: (id: string, completed: boolean) => void;
  onClick?: (task: TaskWithRelations) => void;
  isDragging?: boolean;
  className?: string;
}

export function TaskItem({
  task,
  list,
  labels = [],
  subtaskCount = 0,
  completedSubtasks = 0,
  onToggleComplete,
  onClick,
  isDragging = false,
  className,
}: TaskItemProps) {
  const isOverdue = task.date && new Date(task.date) < new Date() && !task.completed;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      whileHover={{ backgroundColor: "var(--accent)" }}
      className={cn(
        "group flex items-center gap-3 py-2 px-3 rounded-md cursor-pointer transition-colors",
        isDragging && "bg-accent shadow-md",
        task.completed && "opacity-60",
        className
      )}
      onClick={() => onClick?.(task)}
    >
      {/* Checkbox */}
      <div onClick={(e) => e.stopPropagation()}>
        <TaskCheckboxPriority
          checked={task.completed}
          onCheckedChange={(checked) => {
            onToggleComplete?.(task.id, checked);
          }}
          priority={task.priority}
          size="md"
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {/* Task name */}
          <span
            className={cn(
              "text-sm font-medium truncate",
              task.completed && "line-through text-muted-foreground"
            )}
          >
            {task.name}
          </span>

          {/* Priority indicator */}
          {task.priority !== "none" && (
            <PriorityDot priority={task.priority} size="sm" />
          )}
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-2 mt-0.5">
          {/* List indicator */}
          {list && (
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-full"
              style={{
                backgroundColor: list.color + "20",
                color: list.color,
              }}
            >
              {list.name}
            </span>
          )}

          {/* Due date */}
          {task.date && (
            <TaskDueDate
              date={task.date}
              isOverdue={!!isOverdue}
              size="sm"
              showIcon={false}
            />
          )}

          {/* Subtask count */}
          {subtaskCount > 0 && (
            <span className="text-[10px] text-muted-foreground">
              {completedSubtasks}/{subtaskCount} subtasks
            </span>
          )}

          {/* Label dots */}
          {labels.length > 0 && (
            <TaskLabelDots labels={labels} maxVisible={3} size="sm" />
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Minimal task item for compact views
export function TaskItemMinimal({
  task,
  onToggleComplete,
  onClick,
  className,
}: Omit<TaskItemProps, "list" | "labels" | "subtaskCount" | "completedSubtasks" | "isDragging">) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn(
        "flex items-center gap-2 py-1.5 px-2 rounded hover:bg-accent/50 transition-colors",
        task.completed && "opacity-60",
        className
      )}
    >
      <TaskCheckboxPriority
        checked={task.completed}
        onCheckedChange={(checked) => onToggleComplete?.(task.id, checked)}
        size="sm"
      />
      
      <button
        onClick={() => onClick?.(task)}
        className="flex-1 text-left min-w-0"
      >
        <span
          className={cn(
            "text-sm truncate block",
            task.completed && "line-through text-muted-foreground"
          )}
        >
          {task.name}
        </span>
      </button>

      {task.priority !== "none" && (
        <PriorityDot priority={task.priority} size="sm" />
      )}
    </motion.div>
  );
}
