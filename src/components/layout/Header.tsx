"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { 
  Search, 
  Plus, 
  Bell, 
  Command,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface HeaderProps {
  onMenuClick?: () => void;
  onSearchChange?: (query: string) => void;
  onAddTask?: () => void;
  showMenuButton?: boolean;
  title?: string;
  className?: string;
}

export function Header({
  onMenuClick,
  onSearchChange,
  onAddTask,
  showMenuButton = false,
  title = "Today",
  className,
}: HeaderProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isSearchFocused, setIsSearchFocused] = React.useState(false);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    onSearchChange?.(value);
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border/50 bg-background/80 backdrop-blur-xl px-4 lg:px-6",
        className
      )}
    >
      {/* Left section */}
      <div className="flex items-center gap-3">
        {showMenuButton && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="lg:hidden"
          >
            <Menu className="size-5" />
            <span className="sr-only">Open menu</span>
          </Button>
        )}
        
        <motion.h1
          key={title}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xl font-semibold text-foreground"
        >
          {title}
        </motion.h1>
      </div>

      {/* Center section - Search */}
      <div className="hidden md:flex flex-1 max-w-md mx-8">
        <motion.div
          className={cn(
            "relative w-full transition-all duration-200",
            isSearchFocused && "scale-[1.02]"
          )}
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            className="pl-9 pr-12 h-9 bg-muted/50 border-transparent focus:border-primary/50 focus:bg-background"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden lg:flex items-center gap-0.5 text-xs text-muted-foreground pointer-events-none">
            <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border text-[10px] font-medium">
              <Command className="size-2.5 inline mr-0.5" />
              K
            </kbd>
          </div>
        </motion.div>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-1">
        {/* Mobile search button */}
        <Button variant="ghost" size="icon" className="md:hidden">
          <Search className="size-4" />
          <span className="sr-only">Search</span>
        </Button>

        {/* Add task button */}
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            onClick={onAddTask}
            size="sm"
            className="gap-1.5 hidden sm:flex"
          >
            <Plus className="size-4" />
            <span>Add Task</span>
          </Button>
        </motion.div>
        
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            onClick={onAddTask}
            size="icon"
            className="sm:hidden"
          >
            <Plus className="size-4" />
            <span className="sr-only">Add task</span>
          </Button>
        </motion.div>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="size-4" />
              <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-primary" />
              <span className="sr-only">Notifications</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="py-4 text-center text-sm text-muted-foreground">
              No new notifications
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Theme toggle */}
        <ThemeToggle />

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar className="size-8">
                <AvatarImage src="" alt="User" />
                <AvatarFallback className="text-xs font-medium bg-primary/10 text-primary">
                  JD
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span>John Doe</span>
                <span className="text-xs font-normal text-muted-foreground">
                  john@example.com
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem>
              Keyboard shortcuts
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

// Compact header for mobile
export function HeaderCompact({
  title,
  onMenuClick,
  onAddTask,
}: {
  title?: string;
  onMenuClick?: () => void;
  onAddTask?: () => void;
}) {
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border/50 bg-background/80 backdrop-blur-xl px-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onMenuClick}>
          <Menu className="size-5" />
        </Button>
        <h1 className="text-lg font-semibold">{title}</h1>
      </div>
      
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon">
          <Search className="size-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onAddTask}>
          <Plus className="size-4" />
        </Button>
      </div>
    </header>
  );
}
