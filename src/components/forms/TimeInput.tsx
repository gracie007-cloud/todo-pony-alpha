"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

interface TimeInputProps {
  value: string;
  onChange: (time: string) => void;
  disabled?: boolean;
  className?: string;
}

export function TimeInput({
  value,
  onChange,
  disabled = false,
  className,
}: TimeInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
  };

  return (
    <div className={cn("relative", className)}>
      <Input
        type="time"
        value={value}
        onChange={handleChange}
        disabled={disabled}
        className="pr-8"
      />
      <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground text-xs">
        {value || "--:--"}
      </div>
    </div>
  );
}

// Time picker with hour/minute dropdowns
export function TimePicker({
  value,
  onChange,
  disabled = false,
  className,
}: TimeInputProps) {
  const [hour, minute] = value ? value.split(":").map(Number) : [9, 0];

  const handleHourChange = (newHour: number) => {
    onChange(`${newHour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`);
  };

  const handleMinuteChange = (newMinute: number) => {
    onChange(`${hour.toString().padStart(2, "0")}:${newMinute.toString().padStart(2, "0")}`);
  };

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <select
        value={hour}
        onChange={(e) => handleHourChange(parseInt(e.target.value))}
        disabled={disabled}
        className="px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      >
        {Array.from({ length: 24 }, (_, i) => (
          <option key={i} value={i}>
            {i.toString().padStart(2, "0")}
          </option>
        ))}
      </select>
      <span className="text-muted-foreground font-medium">:</span>
      <select
        value={minute}
        onChange={(e) => handleMinuteChange(parseInt(e.target.value))}
        disabled={disabled}
        className="px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      >
        {Array.from({ length: 12 }, (_, idx) => {
          const i = idx * 5;
          return (
            <option key={i} value={i}>
              {i.toString().padStart(2, "0")}
            </option>
          );
        })}
      </select>
    </div>
  );
}

// Duration input for time estimates
export function DurationInput({
  value,
  onChange,
  disabled = false,
  className,
}: {
  value: number | null; // minutes
  onChange: (minutes: number | null) => void;
  disabled?: boolean;
  className?: string;
}) {
  const [hours, setHours] = React.useState(
    value ? Math.floor(value / 60) : 0
  );
  const [minutes, setMinutes] = React.useState(
    value ? value % 60 : 0
  );

  React.useEffect(() => {
    if (value !== null) {
      setHours(Math.floor(value / 60));
      setMinutes(value % 60);
    }
  }, [value]);

  const handleChange = (newHours: number, newMinutes: number) => {
    setHours(newHours);
    setMinutes(newMinutes);
    const totalMinutes = newHours * 60 + newMinutes;
    onChange(totalMinutes > 0 ? totalMinutes : null);
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex items-center gap-1">
        <Input
          type="number"
          min={0}
          max={99}
          value={hours}
          onChange={(e) => handleChange(parseInt(e.target.value) || 0, minutes)}
          disabled={disabled}
          className="w-16 text-center"
        />
        <span className="text-sm text-muted-foreground">h</span>
      </div>
      <div className="flex items-center gap-1">
        <Input
          type="number"
          min={0}
          max={59}
          step={5}
          value={minutes}
          onChange={(e) => handleChange(hours, parseInt(e.target.value) || 0)}
          disabled={disabled}
          className="w-16 text-center"
        />
        <span className="text-sm text-muted-foreground">m</span>
      </div>
    </div>
  );
}

// Quick duration buttons
export function QuickDurationPicker({
  value,
  onChange,
  className,
}: {
  value: number | null;
  onChange: (minutes: number | null) => void;
  className?: string;
}) {
  const options = [
    { label: "15m", value: 15 },
    { label: "30m", value: 30 },
    { label: "1h", value: 60 },
    { label: "2h", value: 120 },
    { label: "4h", value: 240 },
  ];

  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {options.map((option) => (
        <button
          key={option.label}
          type="button"
          onClick={() => onChange(value === option.value ? null : option.value)}
          className={cn(
            "px-2 py-1 text-xs rounded-md border transition-colors",
            value === option.value
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background border-input hover:bg-accent"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
