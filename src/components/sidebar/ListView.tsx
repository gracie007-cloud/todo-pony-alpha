"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ListWithTaskCount } from "@/lib/types";

interface ListViewProps {
  list: ListWithTaskCount;
  isActive?: boolean;
  isCollapsed?: boolean;
  onClick?: () => void;
  onEdit?: (id: string) => void;
}

export function ListView({
  list,
  isActive = false,
  isCollapsed = false,
  onClick,
  onEdit,
}: ListViewProps) {
  const taskCount = list.task_count - list.completed_count;
  
  if (isCollapsed) {
    return (
      <motion.button
        onClick={onClick}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          "relative size-10 rounded-lg flex items-center justify-center transition-colors",
          isActive
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50"
        )}
        title={list.name}
      >
        {/* Color indicator */}
        <div
          className="size-6 rounded-md flex items-center justify-center text-sm"
          style={{ backgroundColor: list.color + "20" }}
        >
          {list.emoji || list.name.charAt(0).toUpperCase()}
        </div>
        
        {/* Active indicator */}
        {isActive && (
          <motion.div
            layoutId="sidebar-active-list"
            className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-r bg-sidebar-primary"
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
          layoutId="sidebar-active-list-full"
          className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r bg-sidebar-primary"
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      )}
      
      {/* Color dot / Emoji */}
      <div
        className="size-5 rounded flex items-center justify-center text-xs flex-shrink-0"
        style={{ 
          backgroundColor: list.color + "20",
          color: list.color,
        }}
      >
        {list.emoji ? (
          <span>{list.emoji}</span>
        ) : (
          <div
            className="size-2.5 rounded-sm"
            style={{ backgroundColor: list.color }}
          />
        )}
      </div>
      
      {/* Name */}
      <span className="flex-1 truncate text-sm font-medium">
        {list.name}
      </span>
      
      {/* Task count */}
      {taskCount > 0 && (
        <span className={cn(
          "text-xs tabular-nums",
          isActive
            ? "text-sidebar-accent-foreground/60"
            : "text-sidebar-foreground/40"
        )}>
          {taskCount}
        </span>
      )}
      
      {/* Edit button (shown on hover) */}
      {onEdit && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(list.id);
          }}
          className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-sidebar-accent transition-opacity"
        >
          <span className="text-xs">⋯</span>
        </button>
      )}
    </motion.button>
  );
}

// Compact list view for small spaces
export function ListViewCompact({
  list,
  isActive = false,
  onClick,
}: {
  list: ListWithTaskCount;
  isActive?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-2 py-1 rounded text-sm w-full text-left transition-colors",
        isActive
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground hover:bg-accent/50"
      )}
    >
      <div
        className="size-2 rounded-full flex-shrink-0"
        style={{ backgroundColor: list.color }}
      />
      <span className="truncate">{list.name}</span>
      {list.task_count > 0 && (
        <span className="text-xs ml-auto tabular-nums">{list.task_count}</span>
      )}
    </button>
  );
}
