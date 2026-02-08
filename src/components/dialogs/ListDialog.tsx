"use client";

import * as React from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ListForm } from "@/components/forms/ListForm";
import { useLists, useListMutations } from "@/lib/hooks";
import { useAppStore } from "@/lib/store";
import type { ListFormData } from "@/lib/types";

export function ListDialog() {
  const {
    listDialogOpen,
    listDialogMode,
    listDialogListId,
    closeListDialog,
  } = useAppStore();

  const { lists } = useLists();
  const { create, update } = useListMutations();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Get the list being edited
  const editingList = listDialogListId
    ? lists.find((l) => l.id === listDialogListId)
    : null;

  const handleSubmit = async (data: ListFormData) => {
    setIsSubmitting(true);
    try {
      if (listDialogMode === "create") {
        await create({ ...data, is_default: false });
        toast.success("List created successfully");
      } else if (listDialogMode === "edit" && listDialogListId) {
        await update(listDialogListId, data);
        toast.success("List updated successfully");
      }
      closeListDialog();
    } catch (error) {
      toast.error(
        listDialogMode === "create"
          ? "Failed to create list"
          : "Failed to update list"
      );
      console.error("Failed to save list:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      closeListDialog();
    }
  };

  return (
    <Dialog open={listDialogOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {listDialogMode === "create" ? "Create New List" : "Edit List"}
          </DialogTitle>
          <DialogDescription>
            {listDialogMode === "create"
              ? "Create a new list to organize your tasks."
              : "Update the details of your list."}
          </DialogDescription>
        </DialogHeader>

        <ListForm
          initialData={
            editingList
              ? {
                  name: editingList.name,
                  color: editingList.color,
                  emoji: editingList.emoji,
                }
              : undefined
          }
          onSubmit={handleSubmit}
          onCancel={handleClose}
          isSubmitting={isSubmitting}
          mode={listDialogMode}
        />
      </DialogContent>
    </Dialog>
  );
}

export default ListDialog;
