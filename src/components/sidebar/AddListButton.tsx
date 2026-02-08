"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Plus, FolderPlus, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface AddListButtonProps {
  onClick?: () => void;
  isCollapsed?: boolean;
  variant?: "list" | "label";
  className?: string;
}

export function AddListButton({
  onClick,
  isCollapsed = false,
  variant = "list",
  className,
}: AddListButtonProps) {
  const Icon = variant === "list" ? FolderPlus : Tag;
  const label = variant === "list" ? "Add List" : "Add Label";
  
  if (isCollapsed) {
    return (
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={onClick}
          className={cn(
            "size-10 rounded-lg text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/50",
            className
          )}
          title={label}
        >
          <Plus className="size-4" />
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      whileHover={{ x: 2 }}
      whileTap={{ scale: 0.98 }}
    >
      <Button
        variant="ghost"
        size="sm"
        onClick={onClick}
        className={cn(
          "w-full justify-start gap-2 text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/50",
          className
        )}
      >
        <Plus className="size-3.5" />
        <span className="text-sm">{label}</span>
      </Button>
    </motion.div>
  );
}

// Inline add button for section headers
export function AddButton({
  onClick,
  label = "Add",
  className,
}: {
  onClick?: () => void;
  label?: string;
  className?: string;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className={cn(
        "size-5 rounded flex items-center justify-center text-muted-foreground/50 hover:text-foreground hover:bg-accent transition-colors",
        className
      )}
    >
      <Plus className="size-3" />
      <span className="sr-only">{label}</span>
    </motion.button>
  );
}

// Floating add button
export function FloatingAddButton({
  onClick,
  label = "Add Task",
  className,
}: {
  onClick?: () => void;
  label?: string;
  className?: string;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={cn(
        "fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-shadow lg:hidden",
        className
      )}
    >
      <Plus className="size-5" />
      <span className="text-sm font-medium">{label}</span>
    </motion.button>
  );
}
