"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Smile, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const commonEmojis = [
  "💼", "🏠", "🛒", "❤️", "📚", "🎮", "🎵", "✈️",
  "🎯", "💡", "🚀", "⭐", "🔥", "💪", "🎨", "📝",
  "📧", "📞", "💰", "🎁", "🌟", "📌", "🔧", "🖥️",
  "📱", "🚗", "🍕", "☕", "🏃", "🧘", "✅", "⚡",
];

const emojiCategories = {
  "Work": ["💼", "📧", "📞", "📊", "📈", "💰", "🖥️", "📱"],
  "Personal": ["🏠", "❤️", "👨‍👩‍👧", "🐕", "🎮", "🎵", "📚", "🎨"],
  "Health": ["❤️", "🏃", "🧘", "💪", "🥗", "💊", "🚴", "⚽"],
  "Shopping": ["🛒", "🍕", "🥛", "🍞", "🧹", "🧴", "👔", "🎁"],
  "Travel": ["✈️", "🚗", "🏨", "🗺️", "🏖️", "⛰️", "🚆", "🛳️"],
  "Misc": ["⭐", "🔥", "💡", "🎯", "🚀", "📌", "✅", "⚡"],
};

interface EmojiPickerProps {
  value: string | null;
  onChange: (emoji: string | null) => void;
  disabled?: boolean;
  className?: string;
}

export function EmojiPicker({
  value,
  onChange,
  disabled = false,
  className,
}: EmojiPickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [activeCategory, setActiveCategory] = React.useState<keyof typeof emojiCategories | "All">("All");

  const displayEmojis = activeCategory === "All" 
    ? commonEmojis 
    : emojiCategories[activeCategory];

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn("w-full justify-start", className)}
        >
          {value ? (
            <span className="text-lg mr-2">{value}</span>
          ) : (
            <Smile className="mr-2 size-4" />
          )}
          <span className="flex-1 text-left">
            {value || "Choose emoji"}
          </span>
          {value && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange(null);
              }}
              className="hover:bg-accent rounded p-0.5"
            >
              <X className="size-3 text-muted-foreground" />
            </button>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        {/* Category tabs */}
        <div className="flex gap-1 p-2 border-b overflow-x-auto">
          {(["All", ...Object.keys(emojiCategories)] as ("All" | keyof typeof emojiCategories)[]).map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              className={cn(
                "px-2 py-1 text-xs rounded-md whitespace-nowrap transition-colors",
                activeCategory === category
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent"
              )}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Emoji grid */}
        <div className="p-2">
          <div className="grid grid-cols-8 gap-1">
            {displayEmojis.map((emoji) => {
              const isSelected = value === emoji;
              
              return (
                <motion.button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    onChange(emoji);
                    setIsOpen(false);
                  }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className={cn(
                    "size-8 flex items-center justify-center rounded-md text-lg transition-colors",
                    isSelected && "bg-primary/10 ring-1 ring-primary"
                  )}
                >
                  {emoji}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Clear button */}
        {value && (
          <div className="border-t p-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onChange(null);
                setIsOpen(false);
              }}
              className="w-full"
            >
              Remove emoji
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

// Compact emoji picker for inline use
export function EmojiPickerCompact({
  value,
  onChange,
  disabled = false,
  className,
}: EmojiPickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <motion.button
          type="button"
          disabled={disabled}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={cn(
            "size-10 rounded-lg border border-input bg-background flex items-center justify-center text-xl transition-colors hover:bg-accent",
            className
          )}
        >
          {value || "📝"}
        </motion.button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="start">
        <div className="grid grid-cols-8 gap-0.5">
          {commonEmojis.map((emoji) => (
            <motion.button
              key={emoji}
              type="button"
              onClick={() => {
                onChange(emoji);
                setIsOpen(false);
              }}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              className="size-7 flex items-center justify-center rounded text-base hover:bg-accent"
            >
              {emoji}
            </motion.button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
