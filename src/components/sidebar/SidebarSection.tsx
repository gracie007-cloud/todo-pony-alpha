"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface SidebarSectionProps {
  title?: string;
  children: React.ReactNode;
  isCollapsed?: boolean;
  defaultExpanded?: boolean;
  onAddClick?: () => void;
  addLabel?: string;
  className?: string;
}

export function SidebarSection({
  title,
  children,
  isCollapsed = false,
  defaultExpanded = true,
  onAddClick,
  addLabel = "Add",
  className,
}: SidebarSectionProps) {
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);

  if (isCollapsed) {
    return (
      <div className={cn("py-2", className)}>
        <div className="flex flex-col items-center gap-1">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("py-2", className)}>
      {title && (
        <div className="flex items-center justify-between px-3 mb-1">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-xs font-medium text-sidebar-foreground/60 uppercase tracking-wider hover:text-sidebar-foreground transition-colors"
          >
            <motion.div
              animate={{ rotate: isExpanded ? 0 : -90 }}
              transition={{ duration: 0.15 }}
            >
              <ChevronDown className="size-3" />
            </motion.div>
            {title}
          </button>
          
          {onAddClick && (
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={onAddClick}
              className="h-5 w-5 text-sidebar-foreground/40 hover:text-sidebar-foreground"
            >
              <span className="text-sm">+</span>
              <span className="sr-only">{addLabel}</span>
            </Button>
          )}
        </div>
      )}
      
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="space-y-0.5 px-2">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Divider for sidebar sections
export function SidebarDivider({ className }: { className?: string }) {
  return (
    <div className={cn("my-2 mx-3 h-px bg-sidebar-border", className)} />
  );
}
