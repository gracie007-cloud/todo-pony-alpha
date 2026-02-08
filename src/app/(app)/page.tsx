"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TaskList } from "@/components/tasks";
import { NoTasksEmptyState, LoadingSpinner } from "@/components/common";
import { TaskDialog, DeleteConfirmDialog } from "@/components/dialogs";
import { useTodayTasks, useTaskMutations } from "@/lib/hooks";
import { useAppStore } from "@/lib/store";
import type { TaskWithRelations } from "@/lib/types";

export default function HomePage() {
  const { tasks, isLoading, isError, mutate } = useTodayTasks();
  const { toggleComplete, update, remove } = useTaskMutations();
  
  // Dialog state from store
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

  // Get selected task for dialog
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

  const handleEditTask = async (task: TaskWithRelations) => {
    await update(task.id, {
      name: task.name,
      description: task.description,
    });
    closeTaskDialog();
  };

  const handleDeleteTask = async () => {
    if (deleteDialogId) {
      await remove(deleteDialogId);
      closeDeleteDialog();
      closeTaskDialog();
    }
  };

  // Filter tasks based on showCompletedTasks
  const visibleTasks = showCompletedTasks
    ? tasks
    : tasks.filter((t) => !t.completed);

  const incompleteTasks = visibleTasks.filter((t) => !t.completed);
  const completedTasks = visibleTasks.filter((t) => t.completed);

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
      {/* Header section */}
      <div className="flex items-center justify-between">
        <div>
          <motion.h2
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-bold tracking-tight"
          >
            Today
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground"
          >
            {incompleteTasks.length} task{incompleteTasks.length !== 1 ? "s" : ""} remaining
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
            groupBy="priority"
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

      {/* Task detail dialog */}
      <TaskDialog
        task={selectedTask}
        isOpen={taskDialogOpen}
        onClose={closeTaskDialog}
        onToggleComplete={handleToggleComplete}
        onEdit={handleEditTask}
        onDelete={(id) => {
          const task = tasks.find((t) => t.id === id);
          if (task) {
            openDeleteDialog("task", id, task.name);
          }
        }}
      />

      {/* Delete confirmation dialog */}
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
