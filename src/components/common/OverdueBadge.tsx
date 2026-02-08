"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface OverdueBadgeProps {
  count: number;
  onClick?: () => void;
  variant?: "badge" | "pill" | "dot";
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  className?: string;
}

const sizeConfig = {
  sm: {
    badge: "text-xs px-1.5 py-0.5",
    icon: "size-3",
    dot: "size-1.5",
  },
  md: {
    badge: "text-xs px-2 py-0.5",
    icon: "size-3.5",
    dot: "size-2",
  },
  lg: {
    badge: "text-sm px-2.5 py-1",
    icon: "size-4",
    dot: "size-2.5",
  },
};

export function OverdueBadge({
  count,
  onClick,
  variant = "badge",
  size = "md",
  showIcon = true,
  className,
}: OverdueBadgeProps) {
  if (count === 0) return null;

  const config = sizeConfig[size];

  if (variant === "dot") {
    return (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className={cn(
          "rounded-full bg-overdue",
          config.dot,
          className
        )}
      />
    );
  }

  if (variant === "pill") {
    return (
      <motion.button
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        className={cn(
          "inline-flex items-center gap-1 rounded-full bg-overdue/10 text-overdue font-medium",
          config.badge,
          onClick && "cursor-pointer hover:bg-overdue/20 transition-colors",
          className
        )}
      >
        {showIcon && <AlertTriangle className={config.icon} />}
        <span>{count}</span>
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <Badge
        variant="outline"
        onClick={onClick}
        className={cn(
          "bg-overdue/10 text-overdue border-overdue/20 hover:bg-overdue/20 cursor-pointer",
          config.badge,
          className
        )}
      >
        {showIcon && <AlertTriangle className={cn("mr-1", config.icon)} />}
        {count} overdue
      </Badge>
    </motion.div>
  );
}

// Animated counter for overdue tasks
export function OverdueCounter({ 
  count, 
  className 
}: { 
  count: number;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <AnimatePresence mode="popLayout">
        {count > 0 && (
          <motion.div
            key={count}
            initial={{ scale: 0, y: -10 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0, y: 10 }}
            transition={{ type: "spring", stiffness: 500, damping: 25 }}
            className="flex items-center gap-1.5 rounded-full bg-overdue px-2 py-0.5 text-xs font-medium text-overdue-foreground"
          >
            <motion.span
              key={`count-${count}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              {count}
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Pulsing indicator for critical overdue
export function OverdueIndicator({ 
  count,
  className 
}: { 
  count: number;
  className?: string;
}) {
  if (count === 0) return null;

  return (
    <motion.div
      className={cn("relative", className)}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
    >
      {/* Pulse ring */}
      <motion.div
        className="absolute inset-0 rounded-full bg-overdue"
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.5, 0, 0.5],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      {/* Core dot */}
      <div className="relative size-2 rounded-full bg-overdue" />
    </motion.div>
  );
}
