"use client";

import { CreateTaskDialog } from "@/components/dialogs/CreateTaskDialog";
import { ListDialog } from "@/components/dialogs/ListDialog";
import { LabelDialog } from "@/components/dialogs/LabelDialog";
import { DeleteConfirmDialog } from "@/components/dialogs/DeleteConfirmDialog";
import { useAppStore } from "@/lib/store";
import { useListMutations, useLabelMutations, useTaskMutations } from "@/lib/hooks";
import { toast } from "sonner";

/**
 * GlobalDialogs
 * 
 * Renders all global dialogs that are controlled by the app store.
 * This component should be placed at the root of the application.
 */
export function GlobalDialogs() {
  const {
    deleteDialogOpen,
    deleteDialogType,
    deleteDialogId,
    deleteDialogName,
    closeDeleteDialog,
  } = useAppStore();

  const { remove: removeList } = useListMutations();
  const { remove: removeLabel } = useLabelMutations();
  const { remove: removeTask } = useTaskMutations();

  const handleDeleteConfirm = async () => {
    try {
      if (deleteDialogType === "list" && deleteDialogId) {
        await removeList(deleteDialogId);
        toast.success("List deleted successfully");
      } else if (deleteDialogType === "label" && deleteDialogId) {
        await removeLabel(deleteDialogId);
        toast.success("Label deleted successfully");
      } else if (deleteDialogType === "task" && deleteDialogId) {
        await removeTask(deleteDialogId);
        toast.success("Task deleted successfully");
      }
      closeDeleteDialog();
    } catch (error) {
      toast.error(`Failed to delete ${deleteDialogType}`);
      console.error("Delete error:", error);
    }
  };

  const getDeleteDescription = () => {
    switch (deleteDialogType) {
      case "list":
        return `Are you sure you want to delete the list "${deleteDialogName}"? Tasks in this list will be moved to Inbox.`;
      case "label":
        return `Are you sure you want to delete the label "${deleteDialogName}"? This will remove the label from all tasks.`;
      case "task":
        return `Are you sure you want to delete "${deleteDialogName}"? This action cannot be undone.`;
      default:
        return "";
    }
  };

  return (
    <>
      {/* Create Task Dialog */}
      <CreateTaskDialog />
      
      {/* List Dialog (create/edit) */}
      <ListDialog />
      
      {/* Label Dialog (create/edit) */}
      <LabelDialog />
      
      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={closeDeleteDialog}
        onConfirm={handleDeleteConfirm}
        title={`Delete ${deleteDialogType ? deleteDialogType.charAt(0).toUpperCase() + deleteDialogType.slice(1) : ""}`}
        description={getDeleteDescription()}
      />
    </>
  );
}

export default GlobalDialogs;
