"use client";

import * as React from "react";
import { motion, AnimatePresence, PanInfo, useMotionValue, useTransform } from "framer-motion";
import { MoreHorizontal, GripVertical, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { TaskCheckboxPriority } from "./TaskCheckbox";
import { PriorityDot } from "./PriorityBadge";
import { TaskDueDate } from "./TaskDueDate";
import { TaskLabels } from "./TaskLabels";
import { SubtaskProgress, SubtaskMiniProgress } from "./SubtaskProgress";
import { prefersReducedMotion, createTransitionName } from "@/lib/utils/view-transition";
import type { TaskWithRelations } from "@/lib/types";

interface TaskCardProps {
  task: TaskWithRelations;
  onToggleComplete?: (id: string, completed: boolean) => void;
  onClick?: (task: TaskWithRelations) => void;
  isDragging?: boolean;
  showList?: boolean;
  className?: string;
  /** Enable swipe to complete on mobile */
  enableSwipe?: boolean;
  /** Index for staggered animations */
  index?: number;
}

// Animation variants - using as const for proper type inference
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
      type: "spring" as const,
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
      ease: "easeIn" as const,
    },
  },
  hover: {
    y: -2,
    boxShadow: "0 4px 12px -2px oklch(0 0 0 / 0.1)",
    transition: {
      type: "spring" as const,
      stiffness: 400,
      damping: 25,
    },
  },
  tap: {
    scale: 0.98,
    transition: {
      duration: 0.1,
    },
  },
};

// Swipe threshold for completing task
const SWIPE_THRESHOLD = 100;

export function TaskCard({
  task,
  onToggleComplete,
  onClick,
  isDragging = false,
  showList = true,
  className,
  enableSwipe = true,
  index = 0,
}: TaskCardProps) {
  const completedSubtasks = task.subtasks.filter((s) => s.completed).length;
  const isOverdue = task.date && new Date(task.date) < new Date() && !task.completed;
  const reducedMotion = prefersReducedMotion();
  
  // Swipe gesture handling
  const x = useMotionValue(0);
  const background = useTransform(
    x,
    [-SWIPE_THRESHOLD * 2, -SWIPE_THRESHOLD, 0, SWIPE_THRESHOLD, SWIPE_THRESHOLD * 2],
    [
      "oklch(0.65 0.18 145 / 0.3)",
      "oklch(0.65 0.18 145 / 0.2)",
      "transparent",
      "oklch(0.65 0.18 145 / 0.2)",
      "oklch(0.65 0.18 145 / 0.3)",
    ]
  );
  const checkOpacity = useTransform(
    x,
    [-SWIPE_THRESHOLD, 0, SWIPE_THRESHOLD],
    [1, 0, 1]
  );
  const checkScale = useTransform(
    x,
    [-SWIPE_THRESHOLD, 0, SWIPE_THRESHOLD],
    [1, 0.5, 1]
  );

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (Math.abs(info.offset.x) > SWIPE_THRESHOLD) {
      onToggleComplete?.(task.id, !task.completed);
    }
  };

  // Stagger delay based on index
  const staggerDelay = reducedMotion ? 0 : index * 0.05;

  return (
    <motion.div
      variants={cardVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      whileHover={!reducedMotion ? "hover" : undefined}
      whileTap={!reducedMotion ? "tap" : undefined}
      layout={!reducedMotion}
      drag={enableSwipe && !reducedMotion ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.3}
      onDragEnd={handleDragEnd}
      style={{ x: enableSwipe ? x : undefined }}
      transition={{ delay: staggerDelay }}
      className={cn(
        "group relative rounded-lg border bg-card p-3 transition-shadow",
        isDragging && "shadow-lg ring-2 ring-primary/50",
        task.completed && "opacity-60",
        "hover-lift",
        className
      )}
      // View transition name for shared element transitions
      // view-transition-name is set via style for dynamic names
      {...(typeof window !== "undefined" && "startViewTransition" in document && {
        style: { viewTransitionName: createTransitionName("task-card", task.id) },
      })}
    >
      {/* Swipe indicator background */}
      {enableSwipe && !reducedMotion && (
        <motion.div
          className="absolute inset-0 rounded-lg flex items-center justify-center overflow-hidden pointer-events-none"
          style={{ background }}
        >
          <motion.div
            style={{ opacity: checkOpacity, scale: checkScale }}
            className="text-success"
          >
            <Check className="size-8" />
          </motion.div>
        </motion.div>
      )}

      <div className="flex items-start gap-3 relative z-10">
        {/* Drag handle */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing pt-0.5">
          <GripVertical className="size-4 text-muted-foreground/50" />
        </div>

        {/* Checkbox */}
        <TaskCheckboxPriority
          checked={task.completed}
          onCheckedChange={(checked) => onToggleComplete?.(task.id, checked)}
          priority={task.priority}
          size="md"
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <button
            onClick={() => onClick?.(task)}
            className="text-left w-full"
          >
            <h4
              className={cn(
                "text-sm font-medium leading-tight transition-colors",
                task.completed && "line-through text-muted-foreground"
              )}
            >
              {task.name}
            </h4>
          </button>

          {/* Description preview */}
          {task.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {task.description}
            </p>
          )}

          {/* Meta info */}
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {/* Priority */}
            {task.priority !== "none" && (
              <PriorityDot priority={task.priority} size="sm" />
            )}

            {/* Due date */}
            {task.date && (
              <TaskDueDate
                date={task.date}
                isOverdue={!!isOverdue}
                size="sm"
              />
            )}

            {/* List */}
            {showList && task.list && (
              <motion.span
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-[10px] px-1.5 py-0.5 rounded-full"
                style={{
                  backgroundColor: task.list.color + "20",
                  color: task.list.color,
                }}
              >
                {task.list.emoji && <span className="mr-0.5">{task.list.emoji}</span>}
                {task.list.name}
              </motion.span>
            )}

            {/* Subtask progress */}
            {task.subtasks.length > 0 && (
              <SubtaskMiniProgress
                completed={completedSubtasks}
                total={task.subtasks.length}
              />
            )}
          </div>

          {/* Labels */}
          {task.labels.length > 0 && (
            <div className="mt-2">
              <TaskLabels labels={task.labels} maxVisible={3} size="sm" />
            </div>
          )}
        </div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          className="opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Button variant="ghost" size="icon-xs" className="btn-press">
            <MoreHorizontal className="size-4" />
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
}

// Compact task card for lists
export function TaskCardCompact({
  task,
  onToggleComplete,
  onClick,
  className,
  index = 0,
}: TaskCardProps) {
  const isOverdue = task.date && new Date(task.date) < new Date() && !task.completed;
  const reducedMotion = prefersReducedMotion();
  const staggerDelay = reducedMotion ? 0 : index * 0.03;

  return (
    <motion.div
      variants={cardVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      whileHover={!reducedMotion ? { backgroundColor: "oklch(0.96 0.01 260)" } : undefined}
      whileTap={!reducedMotion ? "tap" : undefined}
      layout={!reducedMotion}
      transition={{ delay: staggerDelay }}
      className={cn(
        "group flex items-center gap-2 py-2 px-3 rounded-md transition-colors",
        task.completed && "opacity-60",
        className
      )}
    >
      <TaskCheckboxPriority
        checked={task.completed}
        onCheckedChange={(checked) => onToggleComplete?.(task.id, checked)}
        priority={task.priority}
        size="sm"
      />

      <button
        onClick={() => onClick?.(task)}
        className="flex-1 text-left min-w-0"
      >
        <span
          className={cn(
            "text-sm transition-colors",
            task.completed && "line-through text-muted-foreground"
          )}
        >
          {task.name}
        </span>
      </button>

      {task.priority !== "none" && (
        <PriorityDot priority={task.priority} size="sm" />
      )}

      {task.date && (
        <TaskDueDate date={task.date} isOverdue={!!isOverdue} size="sm" showIcon={false} />
      )}
    </motion.div>
  );
}

// Skeleton loader for task card
export function TaskCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-3 space-y-3">
      <div className="flex items-start gap-3">
        {/* Checkbox skeleton */}
        <div className="size-5 rounded-full skeleton-shimmer" />
        
        {/* Content skeleton */}
        <div className="flex-1 space-y-2">
          <div className="skeleton-text w-3/4 h-4" />
          <div className="skeleton-text w-1/2 h-3" />
          <div className="flex gap-2">
            <div className="skeleton-text w-16 h-3" />
            <div className="skeleton-text w-20 h-3" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default TaskCard;
