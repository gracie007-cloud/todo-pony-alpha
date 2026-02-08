"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Repeat, X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type RecurrenceType = "none" | "daily" | "weekly" | "monthly" | "yearly" | "custom";

interface RecurrencePickerProps {
  value: string | null;
  onChange: (rule: string | null) => void;
  disabled?: boolean;
  className?: string;
}

const recurrenceOptions: { value: RecurrenceType; label: string; description: string }[] = [
  { value: "none", label: "No repeat", description: "One-time task" },
  { value: "daily", label: "Daily", description: "Repeats every day" },
  { value: "weekly", label: "Weekly", description: "Repeats every week" },
  { value: "monthly", label: "Monthly", description: "Repeats every month" },
  { value: "yearly", label: "Yearly", description: "Repeats every year" },
  { value: "custom", label: "Custom", description: "Custom recurrence" },
];

export function RecurrencePicker({
  value,
  onChange,
  disabled = false,
  className,
}: RecurrencePickerProps) {
  const [selectedType, setSelectedType] = React.useState<RecurrenceType>("none");
  const [interval, setInterval] = React.useState(1);
  const [isOpen, setIsOpen] = React.useState(false);

  // Parse existing RRULE if present
  React.useEffect(() => {
    if (!value) {
      setSelectedType("none");
    } else if (value.startsWith("FREQ=DAILY")) {
      setSelectedType("daily");
    } else if (value.startsWith("FREQ=WEEKLY")) {
      setSelectedType("weekly");
    } else if (value.startsWith("FREQ=MONTHLY")) {
      setSelectedType("monthly");
    } else if (value.startsWith("FREQ=YEARLY")) {
      setSelectedType("yearly");
    } else {
      setSelectedType("custom");
    }
  }, [value]);

  const handleTypeChange = (type: RecurrenceType) => {
    setSelectedType(type);
    if (type === "none") {
      onChange(null);
    } else if (type !== "custom") {
      onChange(`FREQ=${type.toUpperCase()};INTERVAL=${interval}`);
    }
  };

  const handleIntervalChange = (newInterval: number) => {
    setInterval(newInterval);
    if (selectedType !== "none" && selectedType !== "custom") {
      onChange(`FREQ=${selectedType.toUpperCase()};INTERVAL=${newInterval}`);
    }
  };

  const getDisplayLabel = () => {
    if (!value || selectedType === "none") return "No repeat";
    const option = recurrenceOptions.find((o) => o.value === selectedType);
    if (interval > 1 && selectedType !== "custom") {
      return `Every ${interval} ${selectedType.toLowerCase().slice(0, -2)}${interval > 1 ? "s" : ""}`;
    }
    return option?.label || "Custom";
  };

  return (
    <div className={cn("relative", className)}>
      <Button
        variant="outline"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full justify-start"
      >
        <Repeat className="mr-2 size-4" />
        <span className="flex-1 text-left">{getDisplayLabel()}</span>
        <ChevronDown className="size-4 opacity-50" />
      </Button>

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
            className="absolute top-full left-0 mt-1 z-50 p-3 rounded-lg border bg-popover shadow-lg w-72"
          >
            {/* Recurrence type */}
            <div className="space-y-1 mb-3">
              {recurrenceOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleTypeChange(option.value)}
                  className={cn(
                    "w-full flex items-center gap-3 px-2 py-1.5 rounded-md text-left transition-colors",
                    selectedType === option.value
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-accent"
                  )}
                >
                  <div className="flex-1">
                    <div className="text-sm font-medium">{option.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {option.description}
                    </div>
                  </div>
                  {selectedType === option.value && (
                    <span className="text-primary text-xs">✓</span>
                  )}
                </button>
              ))}
            </div>

            {/* Interval selector */}
            {selectedType !== "none" && selectedType !== "custom" && (
              <div className="border-t pt-3">
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Repeat every
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    max={99}
                    value={interval}
                    onChange={(e) => handleIntervalChange(parseInt(e.target.value) || 1)}
                    className="w-16"
                  />
                  <span className="text-sm">
                    {selectedType.toLowerCase().slice(0, -2)}
                    {interval > 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            )}

            {/* Custom RRULE input */}
            {selectedType === "custom" && (
              <div className="border-t pt-3">
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  RRULE
                </label>
                <Input
                  value={value || ""}
                  onChange={(e) => onChange(e.target.value || null)}
                  placeholder="FREQ=WEEKLY;BYDAY=MO,WE,FR"
                  className="font-mono text-xs"
                />
              </div>
            )}

            {/* Clear button */}
            {value && (
              <div className="border-t pt-3 mt-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    onChange(null);
                    setIsOpen(false);
                  }}
                  className="w-full"
                >
                  <X className="size-3 mr-1" />
                  Remove recurrence
                </Button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </div>
  );
}

// Quick recurrence buttons
export function QuickRecurrencePicker({
  value,
  onChange,
  className,
}: Omit<RecurrencePickerProps, "disabled">) {
  const options: { value: RecurrenceType; label: string }[] = [
    { value: "none", label: "Once" },
    { value: "daily", label: "Daily" },
    { value: "weekly", label: "Weekly" },
    { value: "monthly", label: "Monthly" },
  ];

  const getCurrentType = (): RecurrenceType => {
    if (!value) return "none";
    if (value.includes("DAILY")) return "daily";
    if (value.includes("WEEKLY")) return "weekly";
    if (value.includes("MONTHLY")) return "monthly";
    return "custom";
  };

  const currentType = getCurrentType();

  const handleSelect = (type: RecurrenceType) => {
    if (type === "none") {
      onChange(null);
    } else {
      onChange(`FREQ=${type.toUpperCase()};INTERVAL=1`);
    }
  };

  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {options.map((option) => (
        <Button
          key={option.value}
          type="button"
          variant={currentType === option.value ? "default" : "outline"}
          size="sm"
          onClick={() => handleSelect(option.value)}
          className="text-xs"
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}
