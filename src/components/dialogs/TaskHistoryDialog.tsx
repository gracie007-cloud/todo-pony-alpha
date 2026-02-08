"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, formatDistanceToNow } from "date-fns";
import { History, ArrowRight, Clock, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { TaskHistory } from "@/lib/types";

interface TaskHistoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: string | null;
  history: TaskHistory[];
  isLoading?: boolean;
}

// Field display names
const fieldLabels: Record<string, string> = {
  name: "Name",
  description: "Description",
  date: "Due Date",
  deadline: "Deadline",
  priority: "Priority",
  completed: "Status",
  list_id: "List",
  recurring_rule: "Recurrence",
  estimate_minutes: "Time Estimate",
  actual_minutes: "Actual Time",
};

// Format field values for display
const formatValue = (fieldName: string, value: string | null): string => {
  if (value === null || value === "") return "None";
  
  switch (fieldName) {
    case "completed":
      return value === "true" ? "Completed" : "Not completed";
    case "priority":
      return value.charAt(0).toUpperCase() + value.slice(1);
    case "date":
    case "deadline":
      try {
        return format(new Date(value), "MMM d, yyyy");
      } catch {
        return value;
      }
    case "estimate_minutes":
    case "actual_minutes":
      const mins = parseInt(value);
      if (mins < 60) return `${mins} minutes`;
      const hours = Math.floor(mins / 60);
      const remainingMins = mins % 60;
      return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
    default:
      return value.length > 50 ? value.slice(0, 50) + "..." : value;
  }
};

export function TaskHistoryDialog({
  isOpen,
  onClose,
  taskId,
  history,
  isLoading = false,
}: TaskHistoryDialogProps) {
  // Group history by date
  const groupedHistory = React.useMemo(() => {
    const groups: Record<string, TaskHistory[]> = {};
    
    history.forEach((item) => {
      const date = format(new Date(item.changed_at), "yyyy-MM-dd");
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(item);
    });
    
    // Sort items within each group by time (newest first)
    Object.keys(groups).forEach((date) => {
      groups[date].sort((a, b) => 
        new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime()
      );
    });
    
    return groups;
  }, [history]);

  const sortedDates = Object.keys(groupedHistory).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[80vh] p-0 gap-0">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <History className="size-5" />
            Change History
          </DialogTitle>
          <DialogDescription>
            View all changes made to this task
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 max-h-[60vh]">
          <div className="p-4 pt-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Clock className="size-6 text-muted-foreground" />
                </motion.div>
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <History className="size-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No history available</p>
              </div>
            ) : (
              <div className="space-y-6">
                {sortedDates.map((date) => (
                  <div key={date}>
                    {/* Date header */}
                    <div className="sticky top-0 bg-background z-10 py-1">
                      <span className="text-xs font-medium text-muted-foreground">
                        {format(new Date(date), "EEEE, MMMM d, yyyy")}
                      </span>
                      <Separator className="mt-1" />
                    </div>

                    {/* History items */}
                    <div className="space-y-3 mt-3">
                      {groupedHistory[date].map((item, index) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="relative pl-4 pb-3 border-l-2 border-muted"
                        >
                          {/* Time indicator */}
                          <div className="absolute -left-1.5 top-0 size-3 rounded-full bg-primary" />
                          
                          <div className="space-y-1">
                            {/* Field name */}
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">
                                {fieldLabels[item.field_name] || item.field_name}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(item.changed_at), "h:mm a")}
                              </span>
                            </div>

                            {/* Value change */}
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-muted-foreground line-through truncate max-w-[120px]">
                                {formatValue(item.field_name, item.old_value)}
                              </span>
                              <ArrowRight className="size-3 text-muted-foreground flex-shrink-0" />
                              <span className="text-foreground truncate max-w-[120px]">
                                {formatValue(item.field_name, item.new_value)}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="border-t p-3 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {history.length} change{history.length !== 1 ? "s" : ""}
          </span>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Compact history list for embedding in other components
export function TaskHistoryList({
  history,
  maxItems = 5,
  className,
}: {
  history: TaskHistory[];
  maxItems?: number;
  className?: string;
}) {
  const visibleHistory = history.slice(0, maxItems);

  if (visibleHistory.length === 0) return null;

  return (
    <div className={cn("space-y-2", className)}>
      {visibleHistory.map((item) => (
        <div
          key={item.id}
          className="flex items-center gap-2 text-xs text-muted-foreground"
        >
          <span className="font-medium">
            {fieldLabels[item.field_name] || item.field_name}
          </span>
          <ArrowRight className="size-2.5" />
          <span className="truncate">
            {formatValue(item.field_name, item.new_value)}
          </span>
          <span className="ml-auto">
            {formatDistanceToNow(new Date(item.changed_at), { addSuffix: true })}
          </span>
        </div>
      ))}
      {history.length > maxItems && (
        <span className="text-xs text-muted-foreground">
          +{history.length - maxItems} more changes
        </span>
      )}
    </div>
  );
}
