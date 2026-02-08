"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { Label } from "@/lib/types";

interface LabelItemProps {
  label: Label;
  count?: number;
  isActive?: boolean;
  isCollapsed?: boolean;
  onClick?: () => void;
  onEdit?: (id: string) => void;
}

export function LabelItem({
  label,
  count,
  isActive = false,
  isCollapsed = false,
  onClick,
  onEdit,
}: LabelItemProps) {
  if (isCollapsed) {
    return (
      <motion.button
        onClick={onClick}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className={cn(
          "relative size-8 rounded-full flex items-center justify-center transition-colors",
          isActive
            ? "ring-2 ring-sidebar-primary ring-offset-2 ring-offset-sidebar"
            : "hover:ring-2 hover:ring-sidebar-accent-foreground/20"
        )}
        title={label.name}
        style={{ backgroundColor: label.color + "30" }}
      >
        <div
          className="size-3 rounded-full"
          style={{ backgroundColor: label.color }}
        />
        
        {/* Active indicator */}
        {isActive && (
          <motion.div
            layoutId="sidebar-active-label"
            className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-r bg-sidebar-primary"
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
        )}
      </motion.button>
    );
  }

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ x: 2 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left transition-colors group relative",
        isActive
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
      )}
    >
      {/* Active indicator */}
      {isActive && (
        <motion.div
          layoutId="sidebar-active-label-full"
          className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r bg-sidebar-primary"
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      )}
      
      {/* Color dot */}
      <div
        className="size-2.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: label.color }}
      />
      
      {/* Name */}
      <span className="flex-1 truncate text-sm">
        {label.name}
      </span>
      
      {/* Count */}
      {count !== undefined && count > 0 && (
        <span className={cn(
          "text-xs tabular-nums",
          isActive
            ? "text-sidebar-accent-foreground/60"
            : "text-sidebar-foreground/40"
        )}>
          {count}
        </span>
      )}
      
      {/* Edit button (shown on hover) */}
      {onEdit && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(label.id);
          }}
          className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-sidebar-accent transition-opacity"
        >
          <span className="text-xs">⋯</span>
        </button>
      )}
    </motion.button>
  );
}

// Compact label badge for task cards
export function LabelBadge({ 
  label, 
  size = "sm" 
}: { 
  label: Label;
  size?: "sm" | "md";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-medium",
        size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-xs"
      )}
      style={{ 
        backgroundColor: label.color + "20",
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

// Label dot for compact display
export function LabelDot({ 
  label,
  size = "md",
}: { 
  label: Label;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClasses = {
    sm: "size-1.5",
    md: "size-2",
    lg: "size-2.5",
  };

  return (
    <div
      className={cn("rounded-full", sizeClasses[size])}
      style={{ backgroundColor: label.color }}
      title={label.name}
    />
  );
}
