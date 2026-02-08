"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { ArrowUp, ArrowDown, Minus, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Priority } from "@/lib/types";

interface PrioritySelectProps {
  value: Priority;
  onChange: (priority: Priority) => void;
  disabled?: boolean;
  className?: string;
}

const priorityConfig = {
  high: {
    label: "High",
    icon: ArrowUp,
    color: "text-priority-high",
    bgColor: "bg-priority-high/10",
  },
  medium: {
    label: "Medium",
    icon: ArrowUp,
    color: "text-priority-medium",
    bgColor: "bg-priority-medium/10",
  },
  low: {
    label: "Low",
    icon: ArrowDown,
    color: "text-priority-low",
    bgColor: "bg-priority-low/10",
  },
  none: {
    label: "None",
    icon: Minus,
    color: "text-muted-foreground",
    bgColor: "bg-muted",
  },
};

export function PrioritySelect({
  value,
  onChange,
  disabled = false,
  className,
}: PrioritySelectProps) {
  const config = priorityConfig[value];
  const Icon = config.icon;

  return (
    <Select
      value={value}
      onValueChange={(v) => onChange(v as Priority)}
      disabled={disabled}
    >
      <SelectTrigger className={cn("w-full", className)}>
        <SelectValue>
          <div className="flex items-center gap-2">
            <Icon className={cn("size-4", config.color)} />
            <span>{config.label}</span>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {(Object.keys(priorityConfig) as Priority[]).map((priority) => {
          const pConfig = priorityConfig[priority];
          const PIcon = pConfig.icon;
          
          return (
            <SelectItem
              key={priority}
              value={priority}
              className="cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <PIcon className={cn("size-4", pConfig.color)} />
                <span>{pConfig.label}</span>
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}

// Button group style priority selector
export function PriorityButtonGroup({
  value,
  onChange,
  disabled = false,
  size = "md",
  className,
}: PrioritySelectProps & { size?: "sm" | "md" | "lg" }) {
  const priorities: Priority[] = ["high", "medium", "low", "none"];

  const sizeClasses = {
    sm: "px-2 py-1 text-xs gap-1",
    md: "px-3 py-1.5 text-sm gap-1.5",
    lg: "px-4 py-2 text-base gap-2",
  };

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {priorities.map((priority) => {
        const config = priorityConfig[priority];
        const Icon = config.icon;
        const isActive = value === priority;

        return (
          <motion.button
            key={priority}
            type="button"
            disabled={disabled}
            onClick={() => onChange(priority)}
            whileHover={{ scale: disabled ? 1 : 1.02 }}
            whileTap={{ scale: disabled ? 1 : 0.98 }}
            className={cn(
              "inline-flex items-center rounded-md border font-medium transition-all",
              sizeClasses[size],
              isActive
                ? cn(config.color, config.bgColor, "border-current")
                : "border-transparent text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            <Icon className="size-3.5" />
            <span>{config.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}

// Compact dropdown for inline use
export function PriorityDropdown({
  value,
  onChange,
  disabled = false,
  className,
}: PrioritySelectProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const config = priorityConfig[value];
  const Icon = config.icon;

  return (
    <div className={cn("relative", className)}>
      <motion.button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          "inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-sm transition-colors",
          config.color,
          config.bgColor,
          "border-current/20",
          "hover:bg-accent"
        )}
      >
        <Icon className="size-3.5" />
        <span>{config.label}</span>
        <ChevronDown className="size-3 ml-0.5" />
      </motion.button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="absolute top-full left-0 mt-1 z-50 py-1 rounded-lg border bg-popover shadow-lg min-w-[120px]"
          >
            {(Object.keys(priorityConfig) as Priority[]).map((priority) => {
              const pConfig = priorityConfig[priority];
              const PIcon = pConfig.icon;
              const isActive = value === priority;

              return (
                <button
                  key={priority}
                  type="button"
                  onClick={() => {
                    onChange(priority);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-1.5 text-sm transition-colors",
                    isActive ? pConfig.color : "text-foreground",
                    "hover:bg-accent"
                  )}
                >
                  <PIcon className="size-4" />
                  <span>{pConfig.label}</span>
                  {isActive && (
                    <span className="ml-auto text-xs">✓</span>
                  )}
                </button>
              );
            })}
          </motion.div>
        </>
      )}
    </div>
  );
}
