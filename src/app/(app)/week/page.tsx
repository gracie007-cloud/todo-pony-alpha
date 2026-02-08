"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Plus, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TaskList } from "@/components/tasks";
import { NoTasksEmptyState, LoadingSpinner } from "@/components/common";
import { TaskDialog, DeleteConfirmDialog } from "@/components/dialogs";
import { useWeekTasks, useTaskMutations } from "@/lib/hooks";
import { useAppStore } from "@/lib/store";
import { formatDate, addDays } from "@/lib/utils/date-utils";
import type { TaskWithRelations } from "@/lib/types";

export default function WeekPage() {
  const { tasks, isLoading, isError, mutate } = useWeekTasks();
  const { toggleComplete, remove } = useTaskMutations();
  
  const {
    taskDialogOpen,
    taskDialogTaskId,
    openTaskDialog,
    closeTaskDialog,
    deleteDialogOpen,
    deleteDialogId,
    deleteDialogName,
    openDeleteDialog,
    closeDeleteDialog,
    showCompletedTasks,
  } = useAppStore();

  const selectedTask = taskDialogTaskId
    ? tasks.find((t) => t.id === taskDialogTaskId) ?? null
    : null;

  const handleToggleComplete = async (id: string, completed: boolean) => {
    await toggleComplete(id, completed);
  };

  const handleTaskClick = (task: TaskWithRelations) => {
    openTaskDialog("view", task.id);
  };

  const handleAddTask = () => {
    openTaskDialog("create");
  };

  const handleDeleteTask = async () => {
    if (deleteDialogId) {
      await remove(deleteDialogId);
      closeDeleteDialog();
      closeTaskDialog();
    }
  };

  const visibleTasks = showCompletedTasks
    ? tasks
    : tasks.filter((t) => !t.completed);

  const incompleteTasks = visibleTasks.filter((t) => !t.completed);
  const completedTasks = visibleTasks.filter((t) => t.completed);

  const today = new Date();
  const weekEnd = addDays(today, 7);
  const dateRange = `${formatDate(today, "MMM d")} - ${formatDate(weekEnd, "MMM d, yyyy")}`;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-destructive">Failed to load tasks</p>
        <Button variant="outline" onClick={() => mutate()}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2"
          >
            <CalendarDays className="size-6 text-primary" />
            <h2 className="text-2xl font-bold tracking-tight">Next 7 Days</h2>
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground mt-1"
          >
            {dateRange}
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="text-sm text-muted-foreground"
          >
            {incompleteTasks.length} task{incompleteTasks.length !== 1 ? "s" : ""} scheduled
          </motion.p>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Button onClick={handleAddTask} className="gap-2">
            <Plus className="size-4" />
            Add Task
          </Button>
        </motion.div>
      </div>

      {/* Task list */}
      {incompleteTasks.length > 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <TaskList
            tasks={incompleteTasks}
            groupBy="date"
            variant="card"
            onToggleComplete={handleToggleComplete}
            onTaskClick={handleTaskClick}
          />
        </motion.div>
      ) : (
        <NoTasksEmptyState onAddTask={handleAddTask} />
      )}

      {/* Completed section */}
      {completedTasks.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="pt-6"
        >
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            Completed ({completedTasks.length})
          </h3>
          <TaskList
            tasks={completedTasks}
            groupBy="none"
            variant="item"
            onToggleComplete={handleToggleComplete}
            onTaskClick={handleTaskClick}
          />
        </motion.div>
      )}

      {/* Dialogs */}
      <TaskDialog
        task={selectedTask}
        isOpen={taskDialogOpen}
        onClose={closeTaskDialog}
        onToggleComplete={handleToggleComplete}
        onDelete={(id) => {
          const task = tasks.find((t) => t.id === id);
          if (task) {
            openDeleteDialog("task", id, task.name);
          }
        }}
      />

      <DeleteConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={closeDeleteDialog}
        onConfirm={handleDeleteTask}
        title="Delete Task"
        description={`Are you sure you want to delete "${deleteDialogName}"? This action cannot be undone.`}
      />
    </div>
  );
}
