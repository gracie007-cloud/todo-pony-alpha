"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { SidebarContent } from "@/components/sidebar/SidebarContent";

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export function MobileNav({ isOpen, onClose, className }: MobileNavProps) {
  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="left"
        className={cn(
          "w-[280px] p-0 bg-sidebar border-sidebar-border",
          className
        )}
      >
        <SheetHeader className="h-16 px-4 border-b border-sidebar-border flex flex-row items-center justify-between">
          <SheetTitle className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">T</span>
            </div>
            <span className="font-semibold text-sidebar-foreground">TaskPlanner</span>
          </SheetTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-sidebar-foreground/50 hover:text-sidebar-foreground"
          >
            <X className="size-4" />
          </Button>
        </SheetHeader>
        
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <SidebarContent isCollapsed={false} onItemClick={onClose} />
        </div>
      </SheetContent>
    </Sheet>
  );
}

// Alternative drawer style for bottom navigation
export function MobileDrawer({ 
  isOpen, 
  onClose, 
  children 
}: { 
  isOpen: boolean; 
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isOpen ? 1 : 0 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden",
          isOpen ? "pointer-events-auto" : "pointer-events-none"
        )}
      />
      
      {/* Drawer */}
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: isOpen ? 0 : "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-sidebar rounded-t-2xl border-t border-sidebar-border shadow-2xl max-h-[80vh] overflow-hidden"
      >
        {/* Handle */}
        <div className="flex justify-center py-3">
          <div className="w-10 h-1 rounded-full bg-sidebar-border" />
        </div>
        
        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(80vh-2rem)]">
          {children}
        </div>
      </motion.div>
    </>
  );
}

// Bottom navigation bar for mobile
export function MobileBottomNav({
  activeView,
  onViewChange,
  onAddTask,
}: {
  activeView: string;
  onViewChange: (view: string) => void;
  onAddTask?: () => void;
}) {
  const navItems = [
    { id: "today", label: "Today", icon: "📋" },
    { id: "next7days", label: "Week", icon: "📅" },
    { id: "all", label: "All", icon: "📝" },
    { id: "completed", label: "Done", icon: "✅" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-background/95 backdrop-blur-xl border-t border-border safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => (
          <motion.button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={cn(
              "flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg transition-colors",
              activeView === item.id
                ? "text-primary"
                : "text-muted-foreground"
            )}
            whileTap={{ scale: 0.95 }}
          >
            <span className="text-lg">{item.icon}</span>
            <span className="text-[10px] font-medium">{item.label}</span>
            {activeView === item.id && (
              <motion.div
                layoutId="bottomNavIndicator"
                className="absolute bottom-1 w-1 h-1 rounded-full bg-primary"
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
          </motion.button>
        ))}
        
        {/* Add task FAB */}
        {onAddTask && (
          <motion.button
            onClick={onAddTask}
            className="flex items-center justify-center size-12 rounded-full bg-primary text-primary-foreground shadow-lg -mt-6"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="text-xl">+</span>
          </motion.button>
        )}
      </div>
    </nav>
  );
}
