"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ColorPicker, ColorPickerCompact } from "./ColorPicker";
import type { LabelFormData } from "@/lib/types";

interface LabelFormProps {
  initialData?: Partial<LabelFormData>;
  onSubmit: (data: LabelFormData) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  mode?: "create" | "edit";
  className?: string;
}

const defaultColors = [
  "#ef4444", "#f97316", "#f59e0b", "#84cc16",
  "#22c55e", "#10b981", "#14b8a6", "#06b6d4",
  "#0ea5e9", "#3b82f6", "#6366f1", "#8b5cf6",
  "#a855f7", "#d946ef", "#ec4899", "#f43f5e",
];

export function LabelForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
  mode = "create",
  className,
}: LabelFormProps) {
  const [name, setName] = React.useState(initialData?.name || "");
  const [color, setColor] = React.useState(initialData?.color || "#8b5cf6");
  const [icon, _setIcon] = React.useState<string | null>(initialData?.icon || null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSubmit({
      name: name.trim(),
      color,
      icon,
    });
  };

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-4", className)}>
      {/* Preview */}
      <div className="flex items-center justify-center p-4 rounded-lg bg-muted/50">
        <motion.div
          key={color + name}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full"
          style={{
            backgroundColor: color + "20",
            color,
          }}
        >
          <div
            className="size-2 rounded-full"
            style={{ backgroundColor: color }}
          />
          <span className="text-sm font-medium">
            {name || "Label Name"}
          </span>
        </motion.div>
      </div>

      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="label-name">Name</Label>
        <Input
          id="label-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter label name"
          autoFocus
          disabled={isSubmitting}
        />
      </div>

      {/* Color */}
      <div className="space-y-2">
        <Label>Color</Label>
        <ColorPicker
          value={color}
          onChange={setColor}
          presetColors={defaultColors}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-4">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={!name.trim() || isSubmitting}>
          {isSubmitting
            ? "Saving..."
            : mode === "create"
            ? "Create Label"
            : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}

// Compact inline form for quick label creation
export function LabelFormInline({
  onSubmit,
  className,
}: {
  onSubmit: (data: LabelFormData) => void;
  className?: string;
}) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [name, setName] = React.useState("");
  const [color, setColor] = React.useState("#8b5cf6");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({ name: name.trim(), color, icon: null });
    setName("");
    setColor("#8b5cf6");
    setIsExpanded(false);
  };

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className={cn(
          "flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-sm text-muted-foreground hover:bg-accent transition-colors",
          className
        )}
      >
        <span className="text-lg">+</span>
        <span>Add label</span>
      </button>
    );
  }

  return (
    <motion.form
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      onSubmit={handleSubmit}
      className={cn("space-y-2 p-2 rounded-md bg-accent/50", className)}
    >
      <div className="flex items-center gap-2">
        <ColorPickerCompact
          value={color}
          onChange={setColor}
        />
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Label name"
          className="flex-1 h-8"
          autoFocus
        />
      </div>
      <div className="flex items-center justify-end gap-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(false)}
        >
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={!name.trim()}>
          Create
        </Button>
      </div>
    </motion.form>
  );
}
