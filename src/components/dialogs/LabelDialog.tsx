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
import { LabelForm } from "@/components/forms/LabelForm";
import { useLabels, useLabelMutations } from "@/lib/hooks";
import { useAppStore } from "@/lib/store";
import type { LabelFormData } from "@/lib/types";

export function LabelDialog() {
  const {
    labelDialogOpen,
    labelDialogMode,
    labelDialogLabelId,
    closeLabelDialog,
  } = useAppStore();

  const { labels } = useLabels();
  const { create, update } = useLabelMutations();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Get the label being edited
  const editingLabel = labelDialogLabelId
    ? labels.find((l) => l.id === labelDialogLabelId)
    : null;

  const handleSubmit = async (data: LabelFormData) => {
    setIsSubmitting(true);
    try {
      if (labelDialogMode === "create") {
        await create(data);
        toast.success("Label created successfully");
      } else if (labelDialogMode === "edit" && labelDialogLabelId) {
        await update(labelDialogLabelId, data);
        toast.success("Label updated successfully");
      }
      closeLabelDialog();
    } catch (error) {
      toast.error(
        labelDialogMode === "create"
          ? "Failed to create label"
          : "Failed to update label"
      );
      console.error("Failed to save label:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      closeLabelDialog();
    }
  };

  return (
    <Dialog open={labelDialogOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {labelDialogMode === "create" ? "Create New Label" : "Edit Label"}
          </DialogTitle>
          <DialogDescription>
            {labelDialogMode === "create"
              ? "Create a new label to categorize your tasks."
              : "Update the details of your label."}
          </DialogDescription>
        </DialogHeader>

        <LabelForm
          initialData={
            editingLabel
              ? {
                  name: editingLabel.name,
                  color: editingLabel.color,
                  icon: editingLabel.icon,
                }
              : undefined
          }
          onSubmit={handleSubmit}
          onCancel={handleClose}
          isSubmitting={isSubmitting}
          mode={labelDialogMode}
        />
      </DialogContent>
    </Dialog>
  );
}

export default LabelDialog;
