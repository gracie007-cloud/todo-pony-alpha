"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Plus, CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TaskList } from "@/components/tasks";
import { NoTasksEmptyState, LoadingSpinner } from "@/components/common";
import { TaskDialog, DeleteConfirmDialog } from "@/components/dialogs";
import { useTasks, useTaskMutations } from "@/lib/hooks";
import { useAppStore } from "@/lib/store";
import type { TaskWithRelations } from "@/lib/types";

export default function UpcomingPage() {
  // Get all incomplete tasks with dates
  const { tasks: allTasks, isLoading, isError, mutate } = useTasks({ completed: false });
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
  } = useAppStore();

  // Filter to only tasks with future dates
  const tasks = React.useMemo(() => {
    const now = new Date();
    return allTasks.filter((task) => {
      if (!task.date) return false;
      const taskDate = new Date(task.date);
      return taskDate >= now;
    });
  }, [allTasks]);

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
            <CalendarClock className="size-6 text-primary" />
            <h2 className="text-2xl font-bold tracking-tight">Upcoming</h2>
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground mt-1"
          >
            All scheduled tasks
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="text-sm text-muted-foreground"
          >
            {tasks.length} upcoming task{tasks.length !== 1 ? "s" : ""}
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
      {tasks.length > 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <TaskList
            tasks={tasks}
            groupBy="date"
            variant="card"
            onToggleComplete={handleToggleComplete}
            onTaskClick={handleTaskClick}
          />
        </motion.div>
      ) : (
        <NoTasksEmptyState onAddTask={handleAddTask} />
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
