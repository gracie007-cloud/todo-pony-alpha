"use client";

import * as React from "react";
import { motion, AnimatePresence, useSpring, Variants } from "framer-motion";
import { 
  ChevronLeft, 
  ChevronRight,
  Pin,
  PinOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SidebarContent } from "@/components/sidebar/SidebarContent";
import { useAppStore } from "@/lib/store";
import { prefersReducedMotion } from "@/lib/utils/view-transition";

interface SidebarProps {
  className?: string;
}

// Animation variants
const sidebarVariants: Variants = {
  expanded: {
    width: 280,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30,
    },
  },
  collapsed: {
    width: 72,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30,
    },
  },
};

const contentVariants: Variants = {
  expanded: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.2,
      ease: "easeOut",
    },
  },
  collapsed: {
    opacity: 0,
    x: -10,
    transition: {
      duration: 0.15,
      ease: "easeIn",
    },
  },
};

const iconVariants: Variants = {
  expanded: {
    scale: 1,
    transition: { type: "spring", stiffness: 400, damping: 25 },
  },
  collapsed: {
    scale: 1.1,
    transition: { type: "spring", stiffness: 400, damping: 25 },
  },
};

export function Sidebar({ className }: SidebarProps) {
  const { sidebarCollapsed: isCollapsed, toggleSidebar } = useAppStore();
  const [isPinned, setIsPinned] = React.useState(false);
  const [isHovering, setIsHovering] = React.useState(false);
  const reducedMotion = prefersReducedMotion();

  // Spring-based width for smoother animation
  const width = useSpring(isCollapsed ? 72 : 280, {
    stiffness: 300,
    damping: 30,
  });

  React.useEffect(() => {
    width.set(isCollapsed ? 72 : 280);
  }, [isCollapsed, width]);

  // Show expanded content when not collapsed or when hovering (if pinned)
  const showExpandedContent = !isCollapsed || (isPinned && isHovering);

  const handlePinToggle = () => {
    setIsPinned(!isPinned);
  };

  return (
    <TooltipProvider delayDuration={0}>
      <motion.aside
        variants={sidebarVariants}
        initial={isCollapsed ? "collapsed" : "expanded"}
        animate={isCollapsed ? "collapsed" : "expanded"}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        className={cn(
          "relative flex flex-col h-screen border-r border-sidebar-border bg-sidebar",
          "view-transition-sidebar",
          className
        )}
        style={reducedMotion ? undefined : { width }}
      >
        {/* Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
          <AnimatePresence mode="wait">
            {showExpandedContent && (
              <motion.div
                key="expanded-header"
                variants={contentVariants}
                initial="collapsed"
                animate="expanded"
                exit="collapsed"
                className="flex items-center gap-2"
              >
                <motion.div
                  variants={iconVariants}
                  initial={false}
                  animate={isCollapsed ? "collapsed" : "expanded"}
                  className="size-8 rounded-lg bg-primary flex items-center justify-center"
                >
                  <span className="text-primary-foreground font-bold text-sm">T</span>
                </motion.div>
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="font-semibold text-sidebar-foreground whitespace-nowrap"
                >
                  TaskPlanner
                </motion.span>
              </motion.div>
            )}
          </AnimatePresence>
          
          {isCollapsed && !showExpandedContent && (
            <motion.div
              variants={iconVariants}
              initial={false}
              animate="collapsed"
              className="size-8 rounded-lg bg-primary flex items-center justify-center mx-auto"
            >
              <span className="text-primary-foreground font-bold text-sm">T</span>
            </motion.div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <SidebarContent isCollapsed={isCollapsed && !showExpandedContent} />
        </div>

        {/* Footer controls */}
        <motion.div
          className="border-t border-sidebar-border p-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center justify-between">
            {/* Pin button */}
            <AnimatePresence>
              {showExpandedContent && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.15 }}
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={handlePinToggle}
                        className={cn(
                          "text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors btn-press",
                          isPinned && "text-sidebar-primary"
                        )}
                      >
                        <motion.div
                          animate={{ rotate: isPinned ? -45 : 0 }}
                          transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        >
                          {isPinned ? (
                            <PinOff className="size-3.5" />
                          ) : (
                            <Pin className="size-3.5" />
                          )}
                        </motion.div>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      {isPinned ? "Unpin sidebar" : "Pin sidebar"}
                    </TooltipContent>
                  </Tooltip>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Collapse toggle */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={toggleSidebar}
                  className={cn(
                    "text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors btn-press",
                    isCollapsed && "mx-auto"
                  )}
                >
                  <motion.div
                    animate={{ rotate: isCollapsed ? 180 : 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  >
                    <ChevronLeft className="size-4" />
                  </motion.div>
                </Button>
              </TooltipTrigger>
              <TooltipContent side={isCollapsed ? "right" : "top"}>
                {isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              </TooltipContent>
            </Tooltip>
          </div>
        </motion.div>

        {/* Hover expand overlay for collapsed pinned sidebar */}
        <AnimatePresence>
          {isCollapsed && isPinned && isHovering && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-sidebar pointer-events-none z-10"
              style={{ width: 280 }}
            />
          )}
        </AnimatePresence>
      </motion.aside>
    </TooltipProvider>
  );
}

// Collapsed sidebar icon button
export function SidebarCollapsedTrigger({ onClick }: { onClick: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <Button
        variant="ghost"
        size="icon"
        onClick={onClick}
        className="fixed left-4 top-4 z-50 lg:hidden btn-press"
      >
        <ChevronRight className="size-5" />
        <span className="sr-only">Open sidebar</span>
      </Button>
    </motion.div>
  );
}

// Mobile sidebar with slide animation
export function SidebarMobile({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const reducedMotion = prefersReducedMotion();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={onClose}
          />

          {/* Sidebar */}
          <motion.aside
            initial={reducedMotion ? undefined : { x: -280 }}
            animate={{ x: 0 }}
            exit={reducedMotion ? { opacity: 0 } : { x: -280 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
            }}
            className="fixed left-0 top-0 h-full w-[280px] z-50 bg-sidebar border-r border-sidebar-border lg:hidden"
          >
            <SidebarContent onItemClick={onClose} />
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

export default Sidebar;
