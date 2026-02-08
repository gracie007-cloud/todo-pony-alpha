"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  presetColors?: string[];
  className?: string;
}

const defaultColors = [
  "#ef4444", // Red
  "#f97316", // Orange
  "#f59e0b", // Amber
  "#84cc16", // Lime
  "#22c55e", // Green
  "#10b981", // Emerald
  "#14b8a6", // Teal
  "#06b6d4", // Cyan
  "#0ea5e9", // Sky
  "#3b82f6", // Blue
  "#6366f1", // Indigo
  "#8b5cf6", // Violet
  "#a855f7", // Purple
  "#d946ef", // Fuchsia
  "#ec4899", // Pink
  "#f43f5e", // Rose
];

export function ColorPicker({
  value,
  onChange,
  presetColors = defaultColors,
  className,
}: ColorPickerProps) {
  return (
    <div className={cn("grid grid-cols-8 gap-1.5", className)}>
      {presetColors.map((color) => {
        const isSelected = value.toLowerCase() === color.toLowerCase();
        
        return (
          <motion.button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className={cn(
              "size-6 rounded-md transition-all",
              isSelected && "ring-2 ring-offset-2 ring-offset-background"
            )}
            style={{
              backgroundColor: color,
              "--tw-ring-color": isSelected ? color : undefined,
            } as React.CSSProperties}
          >
            {isSelected && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-full h-full flex items-center justify-center"
              >
                <svg
                  className="size-3.5 text-white drop-shadow-sm"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </motion.div>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}

// Compact color picker with dropdown
export function ColorPickerCompact({
  value,
  onChange,
  presetColors = defaultColors,
  className,
}: ColorPickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className={cn("relative", className)}>
      <motion.button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="size-8 rounded-md border border-border shadow-sm"
        style={{ backgroundColor: value }}
      />
      
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute top-full left-0 mt-1 z-50 p-2 rounded-lg border bg-popover shadow-lg"
          >
            <ColorPicker
              value={value}
              onChange={(color) => {
                onChange(color);
                setIsOpen(false);
              }}
              presetColors={presetColors}
            />
          </motion.div>
        </>
      )}
    </div>
  );
}

// Color input with custom hex support
export function ColorPickerWithInput({
  value,
  onChange,
  presetColors = defaultColors,
  className,
}: ColorPickerProps) {
  const [hexValue, setHexValue] = React.useState(value);

  React.useEffect(() => {
    setHexValue(value);
  }, [value]);

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setHexValue(newValue);
    
    // Validate hex color
    if (/^#[0-9A-Fa-f]{6}$/.test(newValue)) {
      onChange(newValue);
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <ColorPicker value={value} onChange={onChange} presetColors={presetColors} />
      <div className="flex items-center gap-2">
        <div
          className="size-8 rounded-md border border-border"
          style={{ backgroundColor: value }}
        />
        <input
          type="text"
          value={hexValue}
          onChange={handleHexChange}
          placeholder="#000000"
          className="flex-1 px-2 py-1 text-sm rounded-md border border-input bg-background"
          maxLength={7}
        />
      </div>
    </div>
  );
}
