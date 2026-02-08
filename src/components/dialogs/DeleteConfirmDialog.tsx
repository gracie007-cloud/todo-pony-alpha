"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  itemName?: string;
  isDeleting?: boolean;
  variant?: "danger" | "warning";
}

export function DeleteConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = "Delete Item",
  description,
  itemName,
  isDeleting = false,
  variant = "danger",
}: DeleteConfirmDialogProps) {
  const defaultDescription = itemName
    ? `Are you sure you want to delete "${itemName}"? This action cannot be undone.`
    : "Are you sure you want to delete this item? This action cannot be undone.";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 25 }}
              className={cn(
                "size-10 rounded-full flex items-center justify-center flex-shrink-0",
                variant === "danger" ? "bg-destructive/10" : "bg-warning/10"
              )}
            >
              {variant === "danger" ? (
                <Trash2 className="size-5 text-destructive" />
              ) : (
                <AlertTriangle className="size-5 text-warning" />
              )}
            </motion.div>
            <div className="flex-1">
              <DialogTitle className="text-lg">{title}</DialogTitle>
              <DialogDescription className="mt-1.5">
                {description || defaultDescription}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <DialogFooter className="mt-4 gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
            className="gap-2"
          >
            {isDeleting ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <div className="size-4 border-2 border-current border-t-transparent rounded-full" />
                </motion.div>
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="size-4" />
                Delete
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Specific delete dialogs for different entity types
export function DeleteTaskDialog({
  isOpen,
  onClose,
  onConfirm,
  taskName,
  isDeleting,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  taskName?: string;
  isDeleting?: boolean;
}) {
  return (
    <DeleteConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Delete Task"
      description={`Are you sure you want to delete "${taskName || "this task"}"? All subtasks, reminders, and attachments will also be deleted.`}
      itemName={taskName}
      isDeleting={isDeleting}
    />
  );
}

export function DeleteListDialog({
  isOpen,
  onClose,
  onConfirm,
  listName,
  taskCount = 0,
  isDeleting,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  listName?: string;
  taskCount?: number;
  isDeleting?: boolean;
}) {
  const description = taskCount > 0
    ? `Are you sure you want to delete "${listName || "this list"}"? This will also delete ${taskCount} task${taskCount !== 1 ? "s" : ""} in this list. This action cannot be undone.`
    : undefined;

  return (
    <DeleteConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Delete List"
      description={description}
      itemName={listName}
      isDeleting={isDeleting}
    />
  );
}

export function DeleteLabelDialog({
  isOpen,
  onClose,
  onConfirm,
  labelName,
  isDeleting,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  labelName?: string;
  isDeleting?: boolean;
}) {
  return (
    <DeleteConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Delete Label"
      description={`Are you sure you want to delete "${labelName || "this label"}"? It will be removed from all tasks that have it.`}
      itemName={labelName}
      isDeleting={isDeleting}
    />
  );
}

// Lightweight confirmation popover for inline use
export function ConfirmPopover({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm",
  message,
  confirmLabel = "Delete",
  isProcessing = false,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmLabel?: string;
  isProcessing?: boolean;
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute z-50 p-3 rounded-lg border bg-popover shadow-lg w-64"
          >
            <p className="text-sm font-medium mb-1">{title}</p>
            {message && (
              <p className="text-xs text-muted-foreground mb-3">{message}</p>
            )}
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={onConfirm}
                disabled={isProcessing}
              >
                {isProcessing ? "..." : confirmLabel}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </>
  );
}
