"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { 
  CheckCircle2, 
  ClipboardList, 
  Inbox, 
  ListTodo, 
  Search,
  AlertCircle,
  FolderOpen,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { fadeInUp, staggerContainer } from "@/lib/types";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  variant?: "default" | "search" | "error" | "success";
  className?: string;
}

const variantConfig = {
  default: {
    icon: ClipboardList,
    iconColor: "text-muted-foreground/50",
    bgColor: "bg-muted/30",
  },
  search: {
    icon: Search,
    iconColor: "text-muted-foreground/50",
    bgColor: "bg-muted/30",
  },
  error: {
    icon: AlertCircle,
    iconColor: "text-destructive/50",
    bgColor: "bg-destructive/5",
  },
  success: {
    icon: CheckCircle2,
    iconColor: "text-success/50",
    bgColor: "bg-success/5",
  },
};

export function EmptyState({
  icon,
  title,
  description,
  action,
  variant = "default",
  className,
}: EmptyStateProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <motion.div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4 text-center",
        className
      )}
      variants={staggerContainer}
      initial="initial"
      animate="animate"
    >
      <motion.div
        variants={fadeInUp}
        className={cn(
          "mb-4 rounded-full p-4",
          config.bgColor
        )}
      >
        {icon || <Icon className={cn("size-10", config.iconColor)} />}
      </motion.div>
      
      <motion.h3
        variants={fadeInUp}
        className="text-lg font-semibold text-foreground mb-1"
      >
        {title}
      </motion.h3>
      
      {description && (
        <motion.p
          variants={fadeInUp}
          className="text-sm text-muted-foreground max-w-sm mb-4"
        >
          {description}
        </motion.p>
      )}
      
      {action && (
        <motion.div variants={fadeInUp}>
          {action}
        </motion.div>
      )}
    </motion.div>
  );
}

// Pre-configured empty states
export function NoTasksEmptyState({ onAddTask }: { onAddTask?: () => void }) {
  return (
    <EmptyState
      icon={<ListTodo className="size-10 text-muted-foreground/50" />}
      title="No tasks yet"
      description="Create your first task to get started with your daily planning."
      action={
        onAddTask && (
          <Button onClick={onAddTask} className="gap-2">
            <Inbox className="size-4" />
            Add Task
          </Button>
        )
      }
    />
  );
}

export function AllTasksCompletedState() {
  return (
    <EmptyState
      variant="success"
      title="All tasks completed!"
      description="Great work! You've completed all your tasks for today."
    />
  );
}

export function NoSearchResultsState({ query }: { query?: string }) {
  return (
    <EmptyState
      variant="search"
      title="No results found"
      description={
        query
          ? `No tasks match "${query}". Try a different search term.`
          : "Start typing to search your tasks."
      }
    />
  );
}

export function NoListSelectedState() {
  return (
    <EmptyState
      icon={<FolderOpen className="size-10 text-muted-foreground/50" />}
      title="Select a list"
      description="Choose a list from the sidebar to view its tasks."
    />
  );
}

export function ErrorState({ 
  message, 
  onRetry 
}: { 
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <EmptyState
      variant="error"
      title="Something went wrong"
      description={message || "An error occurred while loading your data."}
      action={
        onRetry && (
          <Button onClick={onRetry} variant="outline">
            Try again
          </Button>
        )
      }
    />
  );
}

// Animated illustration placeholder
export function EmptyStateIllustration({ 
  type,
  className,
}: { 
  type: "tasks" | "completed" | "search" | "error";
  className?: string;
}) {
  return (
    <motion.div
      className={cn("relative size-32", className)}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
    >
      {type === "tasks" && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <ClipboardList className="size-16 text-muted-foreground/30" />
        </motion.div>
      )}
      {type === "completed" && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <CheckCircle2 className="size-16 text-success/40" />
        </motion.div>
      )}
      {type === "search" && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <Search className="size-16 text-muted-foreground/30" />
        </motion.div>
      )}
      {type === "error" && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <AlertCircle className="size-16 text-destructive/40" />
        </motion.div>
      )}
    </motion.div>
  );
}
