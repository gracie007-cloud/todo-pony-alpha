"use client";

import * as React from "react";
import { motion, AnimatePresence, Variants, LayoutGroup } from "framer-motion";
import { format, parseISO, isToday, isTomorrow, isPast } from "date-fns";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { TaskCard, TaskCardSkeleton } from "./TaskCard";
import { TaskItem } from "./TaskItem";
import { NoTasksEmptyState, AllTasksCompletedState } from "@/components/common/EmptyState";
import { AnimatedList } from "@/components/animations";
import { prefersReducedMotion } from "@/lib/utils/view-transition";
import type { TaskWithRelations, Priority } from "@/lib/types";

interface TaskListProps {
  tasks: TaskWithRelations[];
  groupBy?: "date" | "priority" | "list" | "none";
  variant?: "card" | "item";
  onToggleComplete?: (id: string, completed: boolean) => void;
  onTaskClick?: (task: TaskWithRelations) => void;
  emptyMessage?: string;
  showCompleted?: boolean;
  className?: string;
  isLoading?: boolean;
}

// Animation variants
const containerVariants: Variants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
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

const groupVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export function TaskList({
  tasks,
  groupBy = "none",
  variant = "card",
  onToggleComplete,
  onTaskClick,
  emptyMessage: _emptyMessage = "No tasks",
  showCompleted = true,
  className,
  isLoading = false,
}: TaskListProps) {
  const reducedMotion = prefersReducedMotion();

  // Filter tasks based on showCompleted
  const visibleTasks = showCompleted
    ? tasks
    : tasks.filter((t) => !t.completed);

  // Group tasks - must be called before any early returns
  const groupedTasks = React.useMemo(() => {
    if (groupBy === "none") {
      return { "": visibleTasks };
    }

    const groups: Record<string, TaskWithRelations[]> = {};

    visibleTasks.forEach((task) => {
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
  }, [visibleTasks, groupBy]);

  // Loading state with skeletons
  if (isLoading) {
    return (
      <div className={cn("space-y-2", className)}>
        {[...Array(3)].map((_, i) => (
          <TaskCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  // Empty states
  if (visibleTasks.length === 0) {
    const completedCount = tasks.filter((t) => t.completed).length;
    if (completedCount === tasks.length && tasks.length > 0) {
      return <AllTasksCompletedState />;
    }
    return <NoTasksEmptyState />;
  }

  return (
    <LayoutGroup>
      <motion.div
        variants={groupVariants}
        initial="hidden"
        animate="visible"
        className={cn("space-y-6", className)}
      >
        {Object.entries(groupedTasks).map(([groupName, groupTasks]) => (
          <TaskGroup
            key={groupName}
            title={groupBy !== "none" ? groupName : undefined}
            tasks={groupTasks}
            variant={variant}
            onToggleComplete={onToggleComplete}
            onTaskClick={onTaskClick}
            reducedMotion={reducedMotion}
          />
        ))}
      </motion.div>
    </LayoutGroup>
  );
}

// Individual task group
interface TaskGroupProps {
  title?: string;
  tasks: TaskWithRelations[];
  variant?: "card" | "item";
  onToggleComplete?: (id: string, completed: boolean) => void;
  onTaskClick?: (task: TaskWithRelations) => void;
  defaultExpanded?: boolean;
  reducedMotion?: boolean;
}

function TaskGroup({
  title,
  tasks,
  variant = "card",
  onToggleComplete,
  onTaskClick,
  defaultExpanded = true,
  reducedMotion = false,
}: TaskGroupProps) {
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);
  const completedCount = tasks.filter((t) => t.completed).length;

  if (!title) {
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-2"
      >
        <AnimatePresence mode="popLayout">
          {tasks.map((task, index) => (
            <motion.div
              key={task.id}
              variants={itemVariants}
              layout={!reducedMotion}
            >
              {variant === "card" ? (
                <TaskCard
                  task={task}
                  onToggleComplete={onToggleComplete}
                  onClick={onTaskClick}
                  index={index}
                />
              ) : (
                <TaskItem
                  task={task}
                  onToggleComplete={onToggleComplete}
                  onClick={onTaskClick}
                />
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    );
  }

  return (
    <motion.div variants={itemVariants} className="space-y-2">
      {/* Group header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 w-full text-left group"
      >
        <motion.div
          animate={{ rotate: isExpanded ? 0 : -90 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
        >
          <ChevronDown className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" />
        </motion.div>
        <h3 className="text-sm font-medium text-foreground">{title}</h3>
        <motion.span 
          className="text-xs text-muted-foreground"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          key={completedCount}
        >
          {completedCount > 0 ? (
            <>{completedCount}/{tasks.length} completed</>
          ) : (
            <>{tasks.length} tasks</>
          )}
        </motion.span>
      </button>

      {/* Group content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-2 pl-6"
            >
              <AnimatePresence mode="popLayout">
                {tasks.map((task, index) => (
                  <motion.div
                    key={task.id}
                    variants={itemVariants}
                    layout={!reducedMotion}
                  >
                    {variant === "card" ? (
                      <TaskCard
                        task={task}
                        onToggleComplete={onToggleComplete}
                        onClick={onTaskClick}
                        index={index}
                      />
                    ) : (
                      <TaskItem
                        task={task}
                        onToggleComplete={onToggleComplete}
                        onClick={onTaskClick}
                      />
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Simple flat list without grouping
export function TaskListFlat({
  tasks,
  onToggleComplete,
  onTaskClick,
  className,
  isLoading,
}: Omit<TaskListProps, "groupBy" | "variant">) {
  const reducedMotion = prefersReducedMotion();

  if (isLoading) {
    return (
      <div className={cn("space-y-1", className)}>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="py-2 px-3">
            <div className="skeleton-text w-3/4 h-4" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <LayoutGroup>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className={cn("space-y-1", className)}
      >
        <AnimatePresence mode="popLayout">
          {tasks.map((task) => (
            <motion.div
              key={task.id}
              variants={itemVariants}
              layout={!reducedMotion}
            >
              <TaskItem
                task={task}
                onToggleComplete={onToggleComplete}
                onClick={onTaskClick}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </LayoutGroup>
  );
}

// Task list with animated add/remove using AnimatedList
export function TaskListAnimated({
  tasks,
  onToggleComplete,
  onTaskClick,
  className,
}: Omit<TaskListProps, "groupBy" | "variant">) {
  return (
    <AnimatedList
      items={tasks}
      getKey={(task) => task.id}
      renderItem={(task, index) => (
        <TaskCard
          task={task}
          onToggleComplete={onToggleComplete}
          onClick={onTaskClick}
          index={index}
        />
      )}
      addAnimation="slide"
      removeAnimation="shrink"
      staggerDelay={0.03}
      className={cn("space-y-2", className)}
    />
  );
}

export default TaskList;
