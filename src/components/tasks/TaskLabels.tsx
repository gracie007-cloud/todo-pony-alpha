"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { Label } from "@/lib/types";

interface TaskLabelsProps {
  labels: Label[];
  maxVisible?: number;
  size?: "sm" | "md";
  className?: string;
}

export function TaskLabels({
  labels,
  maxVisible = 3,
  size = "sm",
  className,
}: TaskLabelsProps) {
  if (!labels.length) return null;

  const visibleLabels = labels.slice(0, maxVisible);
  const remainingCount = labels.length - maxVisible;

  const sizeClasses = {
    sm: {
      container: "gap-1",
      badge: "px-1.5 py-0.5 text-[10px]",
      dot: "size-1",
    },
    md: {
      container: "gap-1.5",
      badge: "px-2 py-0.5 text-xs",
      dot: "size-1.5",
    },
  };

  const config = sizeClasses[size];

  return (
    <div className={cn("flex flex-wrap items-center", config.container, className)}>
      <AnimatePresence mode="popLayout">
        {visibleLabels.map((label, index) => (
          <motion.span
            key={label.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ delay: index * 0.05 }}
            className={cn(
              "inline-flex items-center gap-1 rounded-full font-medium",
              config.badge
            )}
            style={{
              backgroundColor: label.color + "15",
              color: label.color,
            }}
          >
            <span
              className={cn("rounded-full", config.dot)}
              style={{ backgroundColor: label.color }}
            />
            {label.name}
          </motion.span>
        ))}
      </AnimatePresence>
      
      {remainingCount > 0 && (
        <motion.span
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className={cn(
            "inline-flex items-center rounded-full bg-muted text-muted-foreground font-medium",
            config.badge
          )}
        >
          +{remainingCount}
        </motion.span>
      )}
    </div>
  );
}

// Compact label dots for small spaces
export function TaskLabelDots({
  labels,
  maxVisible = 3,
  size = "sm",
  className,
}: {
  labels: Label[];
  maxVisible?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  if (!labels.length) return null;

  const visibleLabels = labels.slice(0, maxVisible);
  const remainingCount = labels.length - maxVisible;

  const sizeClasses = {
    sm: "size-1.5",
    md: "size-2",
    lg: "size-2.5",
  };

  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {visibleLabels.map((label) => (
        <motion.div
          key={label.id}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className={cn("rounded-full", sizeClasses[size])}
          style={{ backgroundColor: label.color }}
          title={label.name}
        />
      ))}
      {remainingCount > 0 && (
        <span className="text-[10px] text-muted-foreground ml-0.5">
          +{remainingCount}
        </span>
      )}
    </div>
  );
}

// Single label badge
export function TaskLabelBadge({
  label,
  size = "sm",
  className,
}: {
  label: Label;
  size?: "sm" | "md";
  className?: string;
}) {
  const sizeClasses = {
    sm: "px-1.5 py-0.5 text-[10px] gap-0.5",
    md: "px-2 py-0.5 text-xs gap-1",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium",
        sizeClasses[size],
        className
      )}
      style={{
        backgroundColor: label.color + "15",
        color: label.color,
      }}
    >
      <span
        className="size-1.5 rounded-full"
        style={{ backgroundColor: label.color }}
      />
      {label.name}
    </span>
  );
}

// Label picker for task forms
export function LabelPicker({
  labels,
  selectedIds,
  onToggle,
  className,
}: {
  labels: Label[];
  selectedIds: string[];
  onToggle: (labelId: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {labels.map((label) => {
        const isSelected = selectedIds.includes(label.id);
        
        return (
          <motion.button
            key={label.id}
            type="button"
            onClick={() => onToggle(label.id)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-all border-2",
              isSelected
                ? "border-current"
                : "border-transparent opacity-60 hover:opacity-100"
            )}
            style={{
              backgroundColor: isSelected ? label.color + "20" : "transparent",
              color: label.color,
              borderColor: isSelected ? label.color : "transparent",
            }}
          >
            <span
              className="size-1.5 rounded-full"
              style={{ backgroundColor: label.color }}
            />
            {label.name}
          </motion.button>
        );
      })}
    </div>
  );
}
