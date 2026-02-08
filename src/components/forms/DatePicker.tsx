"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { Calendar as CalendarIcon, X, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  showTime?: boolean;
  disabled?: boolean;
  className?: string;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  showTime = false,
  disabled = false,
  className,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedHour, setSelectedHour] = React.useState(
    value ? value.getHours() : 9
  );
  const [selectedMinute, setSelectedMinute] = React.useState(
    value ? value.getMinutes() : 0
  );

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      if (showTime) {
        date.setHours(selectedHour);
        date.setMinutes(selectedMinute);
      }
      onChange(date);
      if (!showTime) {
        setIsOpen(false);
      }
    }
  };

  const handleTimeChange = (hour: number, minute: number) => {
    setSelectedHour(hour);
    setSelectedMinute(minute);
    if (value) {
      const newDate = new Date(value);
      newDate.setHours(hour);
      newDate.setMinutes(minute);
      onChange(newDate);
    }
  };

  const formatDisplay = () => {
    if (!value) return placeholder;
    if (showTime) {
      return format(value, "MMM d, yyyy 'at' h:mm a");
    }
    return format(value, "MMM d, yyyy");
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 size-4" />
          <span className="flex-1 truncate">{formatDisplay()}</span>
          {value && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange(null);
              }}
              className="ml-2 hover:bg-accent rounded p-0.5"
            >
              <X className="size-3 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value || undefined}
          onSelect={handleSelect}
          initialFocus
        />
        {showTime && (
          <div className="border-t p-3">
            <div className="flex items-center gap-2">
              <Clock className="size-4 text-muted-foreground" />
              <div className="flex items-center gap-1">
                <select
                  value={selectedHour}
                  onChange={(e) => handleTimeChange(parseInt(e.target.value), selectedMinute)}
                  className="px-2 py-1 rounded border bg-background text-sm"
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>
                      {i.toString().padStart(2, "0")}
                    </option>
                  ))}
                </select>
                <span className="text-muted-foreground">:</span>
                <select
                  value={selectedMinute}
                  onChange={(e) => handleTimeChange(selectedHour, parseInt(e.target.value))}
                  className="px-2 py-1 rounded border bg-background text-sm"
                >
                  {[0, 15, 30, 45].map((m) => (
                    <option key={m} value={m}>
                      {m.toString().padStart(2, "0")}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
        <div className="border-t p-2 flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              handleSelect(new Date());
            }}
            className="flex-1 text-xs"
          >
            Today
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const tomorrow = new Date();
              tomorrow.setDate(tomorrow.getDate() + 1);
              handleSelect(tomorrow);
            }}
            className="flex-1 text-xs"
          >
            Tomorrow
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Quick date buttons
export function QuickDatePicker({
  value,
  onChange,
  className,
}: Omit<DatePickerProps, "placeholder" | "showTime">) {
  const options = [
    { label: "Today", getValue: () => new Date() },
    { label: "Tomorrow", getValue: () => {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      return d;
    }},
    { label: "Next Week", getValue: () => {
      const d = new Date();
      d.setDate(d.getDate() + 7);
      return d;
    }},
    { label: "No Date", getValue: () => null },
  ];

  const isSameDay = (a: Date | null, b: Date | null) => {
    if (!a || !b) return a === b;
    return a.toDateString() === b.toDateString();
  };

  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {options.map((option) => {
        const optionValue = option.getValue();
        const isActive = isSameDay(value, optionValue);
        
        return (
          <Button
            key={option.label}
            type="button"
            variant={isActive ? "default" : "outline"}
            size="sm"
            onClick={() => onChange(optionValue)}
            className="text-xs"
          >
            {option.label}
          </Button>
        );
      })}
      
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="text-xs">
            <CalendarIcon className="size-3 mr-1" />
            Custom
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value || undefined}
            onSelect={(date) => onChange(date || null)}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
