"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Inbox,
  Calendar,
  CalendarDays,
  CheckCircle2,
  ListTodo,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ViewType } from "@/lib/types";

interface ViewItemProps {
  id: ViewType;
  label: string;
  icon?: LucideIcon;
  emoji?: string;
  count?: number;
  isActive?: boolean;
  isCollapsed?: boolean;
  onClick?: () => void;
}

const viewIcons: Record<ViewType, LucideIcon> = {
  today: Calendar,
  next7days: CalendarDays,
  all: ListTodo,
  completed: CheckCircle2,
  inbox: Inbox,
};

export function ViewItem({
  id,
  label,
  icon,
  emoji,
  count,
  isActive = false,
  isCollapsed = false,
  onClick,
}: ViewItemProps) {
  const Icon = icon || viewIcons[id] || ListTodo;
  
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
        title={label}
      >
        {emoji ? (
          <span className="text-lg">{emoji}</span>
        ) : (
          <Icon className="size-5" />
        )}
        
        {/* Active indicator */}
        {isActive && (
          <motion.div
            layoutId="sidebar-active-view"
            className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-r bg-sidebar-primary"
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
        )}
        
        {/* Count badge */}
        {count !== undefined && count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 size-4 rounded-full bg-sidebar-primary text-sidebar-primary-foreground text-[10px] font-medium flex items-center justify-center">
            {count > 9 ? "9+" : count}
          </span>
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
        "w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-left transition-colors relative",
        isActive
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
      )}
    >
      {/* Active indicator */}
      {isActive && (
        <motion.div
          layoutId="sidebar-active-view-full"
          className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r bg-sidebar-primary"
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      )}
      
      {/* Icon */}
      <div className="flex-shrink-0">
        {emoji ? (
          <span className="text-base">{emoji}</span>
        ) : (
          <Icon className="size-4" />
        )}
      </div>
      
      {/* Label */}
      <span className="flex-1 text-sm font-medium truncate">
        {label}
      </span>
      
      {/* Count */}
      {count !== undefined && count > 0 && (
        <span className={cn(
          "text-xs tabular-nums px-1.5 py-0.5 rounded-md",
          isActive
            ? "bg-sidebar-primary/20 text-sidebar-primary"
            : "bg-sidebar-accent/50 text-sidebar-foreground/50"
        )}>
          {count}
        </span>
      )}
    </motion.button>
  );
}

// Pre-configured view items
export function TodayViewItem(props: Omit<ViewItemProps, "id" | "label" | "icon">) {
  return (
    <ViewItem
      id="today"
      label="Today"
      {...props}
    />
  );
}

export function WeekViewItem(props: Omit<ViewItemProps, "id" | "label" | "icon">) {
  return (
    <ViewItem
      id="next7days"
      label="Next 7 Days"
      {...props}
    />
  );
}

export function AllTasksViewItem(props: Omit<ViewItemProps, "id" | "label" | "icon">) {
  return (
    <ViewItem
      id="all"
      label="All Tasks"
      {...props}
    />
  );
}

export function CompletedViewItem(props: Omit<ViewItemProps, "id" | "label" | "icon">) {
  return (
    <ViewItem
      id="completed"
      label="Completed"
      {...props}
    />
  );
}

export function InboxViewItem(props: Omit<ViewItemProps, "id" | "label" | "icon">) {
  return (
    <ViewItem
      id="inbox"
      label="Inbox"
      {...props}
    />
  );
}
