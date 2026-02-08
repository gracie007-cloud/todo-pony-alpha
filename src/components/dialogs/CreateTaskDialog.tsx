"use client";

import * as React from "react";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { TaskForm } from "@/components/forms/TaskForm";
import { useLists, useLabels, useTaskMutations } from "@/lib/hooks";
import { useAppStore } from "@/lib/store";
import type { TaskFormData } from "@/lib/types";

export function CreateTaskDialog() {
  const {
    taskDialogOpen,
    taskDialogMode,
    closeTaskDialog,
  } = useAppStore();

  const { lists } = useLists();
  const { labels } = useLabels();
  const { create } = useTaskMutations();

  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const isOpen = taskDialogOpen && taskDialogMode === "create";

  const handleSubmit = async (data: TaskFormData) => {
    setIsSubmitting(true);
    try {
      await create({
        name: data.name,
        description: data.description,
        list_id: data.list_id,
        date: data.date,
        deadline: data.deadline,
        estimate_minutes: data.estimate_minutes,
        actual_minutes: null,
        priority: data.priority,
        recurring_rule: data.recurring_rule,
      });
      toast.success("Task created successfully");
      closeTaskDialog();
    } catch (error) {
      toast.error("Failed to create task");
      console.error("Failed to create task:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      closeTaskDialog();
    }
  };

  // Get default list (first non-default list or first list)
  const defaultListId = lists.find(l => !l.is_default)?.id || lists[0]?.id || "";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="size-5" />
            Create New Task
          </DialogTitle>
          <DialogDescription>
            Add a new task to your list. Fill in the details below.
          </DialogDescription>
        </DialogHeader>

        <TaskForm
          initialData={{
            list_id: defaultListId,
            priority: "none",
            labels: [],
          }}
          lists={lists}
          labels={labels}
          onSubmit={handleSubmit}
          onCancel={handleClose}
          isSubmitting={isSubmitting}
          mode="create"
        />
      </DialogContent>
    </Dialog>
  );
}

// Quick add task button component
export function QuickAddTask({ listId }: { listId?: string }) {
  const { openTaskDialog } = useAppStore();
  const { lists } = useLists();
  const { create } = useTaskMutations();
  const [isCreating, setIsCreating] = React.useState(false);

  const handleClick = () => {
    openTaskDialog("create");
  };

  return (
    <button
      onClick={handleClick}
      disabled={isCreating}
      className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-md transition-colors w-full"
    >
      {isCreating ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Plus className="size-4" />
      )}
      <span>Add task</span>
    </button>
  );
}

export default CreateTaskDialog;
