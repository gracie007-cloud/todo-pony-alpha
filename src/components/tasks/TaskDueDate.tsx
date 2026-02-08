"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Calendar, Clock, AlertTriangle } from "lucide-react";
import { format, isToday, isTomorrow, isPast, parseISO, isValid } from "date-fns";
import { cn } from "@/lib/utils";

interface TaskDueDateProps {
  date: string | Date | null;
  isOverdue?: boolean;
  showTime?: boolean;
  showIcon?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeConfig = {
  sm: {
    container: "text-[10px] gap-0.5",
    icon: "size-2.5",
  },
  md: {
    container: "text-xs gap-1",
    icon: "size-3",
  },
  lg: {
    container: "text-sm gap-1",
    icon: "size-3.5",
  },
};

export function TaskDueDate({
  date,
  isOverdue: propIsOverdue,
  showTime = false,
  showIcon = true,
  size = "md",
  className,
}: TaskDueDateProps) {
  if (!date) return null;

  const dateObj = typeof date === "string" ? parseISO(date) : date;
  if (!isValid(dateObj)) return null;

  const isOverdue = propIsOverdue ?? (isPast(dateObj) && !isToday(dateObj));
  const sizes = sizeConfig[size];

  const formatDueDate = () => {
    if (isToday(dateObj)) {
      return showTime ? `Today, ${format(dateObj, "HH:mm")}` : "Today";
    }
    if (isTomorrow(dateObj)) {
      return showTime ? `Tomorrow, ${format(dateObj, "HH:mm")}` : "Tomorrow";
    }
    if (showTime) {
      return format(dateObj, "MMM d, HH:mm");
    }
    return format(dateObj, "MMM d");
  };

  return (
    <motion.span
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "inline-flex items-center font-medium",
        sizes.container,
        isOverdue
          ? "text-overdue"
          : isToday(dateObj)
          ? "text-primary"
          : "text-muted-foreground",
        className
      )}
    >
      {showIcon && (
        isOverdue ? (
          <AlertTriangle className={sizes.icon} />
        ) : (
          <Calendar className={sizes.icon} />
        )
      )}
      <span>{formatDueDate()}</span>
    </motion.span>
  );
}

// Time estimate display
export function TaskTimeEstimate({
  minutes,
  actualMinutes,
  size = "md",
  className,
}: {
  minutes: number | null;
  actualMinutes?: number | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  if (!minutes) return null;

  const sizes = sizeConfig[size];
  const formatTime = (mins: number) => {
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
  };

  const isOverEstimate = actualMinutes !== null && actualMinutes !== undefined && actualMinutes > minutes;

  return (
    <span
      className={cn(
        "inline-flex items-center text-muted-foreground",
        sizes.container,
        isOverEstimate && "text-overdue",
        className
      )}
    >
      <Clock className={sizes.icon} />
      <span>
        {formatTime(minutes)}
        {actualMinutes !== null && actualMinutes !== undefined && (
          <span className="text-muted-foreground/60">
            {" / "}
            <span className={isOverEstimate ? "text-overdue" : ""}>
              {formatTime(actualMinutes)}
            </span>
          </span>
        )}
      </span>
    </span>
  );
}

// Relative time display (e.g., "2 hours ago", "in 3 days")
export function RelativeTime({
  date,
  className,
}: {
  date: string | Date;
  className?: string;
}) {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  if (!isValid(dateObj)) return null;

  const now = new Date();
  const diffMs = dateObj.getTime() - now.getTime();
  const diffMins = Math.round(diffMs / 60000);
  const diffHours = Math.round(diffMins / 60);
  const diffDays = Math.round(diffHours / 24);

  const formatRelative = () => {
    if (Math.abs(diffMins) < 1) return "now";
    if (Math.abs(diffMins) < 60) {
      return diffMins > 0 ? `in ${diffMins}m` : `${Math.abs(diffMins)}m ago`;
    }
    if (Math.abs(diffHours) < 24) {
      return diffHours > 0 ? `in ${diffHours}h` : `${Math.abs(diffHours)}h ago`;
    }
    if (Math.abs(diffDays) < 7) {
      return diffDays > 0 ? `in ${diffDays}d` : `${Math.abs(diffDays)}d ago`;
    }
    return format(dateObj, "MMM d");
  };

  const isPast = diffMs < 0;

  return (
    <span
      className={cn(
        "text-xs",
        isPast ? "text-muted-foreground" : "text-muted-foreground",
        className
      )}
    >
      {formatRelative()}
    </span>
  );
}

// Deadline countdown
export function DeadlineCountdown({
  deadline,
  className,
}: {
  deadline: string | Date;
  className?: string;
}) {
  const deadlineDate = typeof deadline === "string" ? parseISO(deadline) : deadline;
  if (!isValid(deadlineDate)) return null;

  const now = new Date();
  const diffMs = deadlineDate.getTime() - now.getTime();
  const isPast = diffMs < 0;
  const diffHours = Math.abs(Math.round(diffMs / 3600000));
  const diffDays = Math.abs(Math.round(diffHours / 24));

  const getUrgencyColor = () => {
    if (isPast) return "text-overdue";
    if (diffHours < 1) return "text-overdue";
    if (diffHours < 24) return "text-priority-high";
    if (diffDays < 3) return "text-priority-medium";
    return "text-muted-foreground";
  };

  const formatCountdown = () => {
    if (isPast) {
      if (diffHours < 1) return "Overdue";
      if (diffDays < 1) return `${diffHours}h overdue`;
      return `${diffDays}d overdue`;
    }
    if (diffHours < 1) return "< 1h left";
    if (diffHours < 24) return `${diffHours}h left`;
    if (diffDays < 7) return `${diffDays}d left`;
    return format(deadlineDate, "MMM d");
  };

  return (
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn("text-xs font-medium", getUrgencyColor(), className)}
    >
      {formatCountdown()}
    </motion.span>
  );
}
