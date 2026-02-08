"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { MobileNav, MobileBottomNav } from "./MobileNav";
import { ToastProvider } from "@/components/providers/ToastProvider";
import { GlobalDialogs } from "@/components/providers/DialogProvider";
import { useAppStore } from "@/lib/store";

interface AppLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function AppLayout({ children, className }: AppLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  
  const {
    mobileSidebarOpen,
    setMobileSidebarOpen,
    activeView,
    setActiveView,
    openTaskDialog,
  } = useAppStore();

  // Determine title based on pathname
  const getTitle = () => {
    if (pathname === "/" || pathname === "/today") return "Today";
    if (pathname === "/week") return "Next 7 Days";
    if (pathname === "/upcoming") return "Upcoming";
    if (pathname === "/all") return "All Tasks";
    if (pathname.startsWith("/list/")) return "List";
    if (pathname.startsWith("/label/")) return "Label";
    return "Tasks";
  };

  // Handle mobile nav toggle
  const handleMobileNavToggle = () => {
    setMobileSidebarOpen(!mobileSidebarOpen);
  };

  // Handle view change (for mobile bottom nav)
  const handleViewChange = (view: string) => {
    setActiveView(view as "today" | "next7days" | "all" | "completed" | "inbox");
    router.push(view === "today" ? "/" : `/${view}`);
  };

  // Handle add task
  const handleAddTask = () => {
    openTaskDialog("create");
  };

  return (
    <div className={cn("flex h-screen overflow-hidden bg-background", className)}>
      {/* Toast notifications */}
      <ToastProvider />
      
      {/* Global Dialogs */}
      <GlobalDialogs />

      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile Navigation */}
      <MobileNav
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <Header
          title={getTitle()}
          onMenuClick={handleMobileNavToggle}
          onAddTask={handleAddTask}
          showMenuButton={true}
        />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="container max-w-4xl py-6 px-4 lg:px-6"
          >
            {children}
          </motion.div>
        </main>

        {/* Mobile Bottom Navigation */}
        <MobileBottomNav
          activeView={activeView}
          onViewChange={handleViewChange}
          onAddTask={handleAddTask}
        />
      </div>
    </div>
  );
}

// Simplified layout without sidebar for special views
export function SimpleLayout({
  children,
  title,
  className,
}: {
  children: React.ReactNode;
  title?: string;
  className?: string;
}) {
  return (
    <div className={cn("min-h-screen bg-background", className)}>
      <ToastProvider />
      <Header title={title} showMenuButton={false} />
      <main className="container max-w-4xl py-6 px-4 lg:px-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}

// Focus mode layout (minimal distractions)
export function FocusLayout({
  children,
  onExit,
  className,
}: {
  children: React.ReactNode;
  onExit?: () => void;
  className?: string;
}) {
  return (
    <div className={cn("min-h-screen bg-background", className)}>
      <ToastProvider />
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={onExit}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          Exit Focus Mode
        </button>
      </div>
      <main className="container max-w-2xl mx-auto py-12 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
