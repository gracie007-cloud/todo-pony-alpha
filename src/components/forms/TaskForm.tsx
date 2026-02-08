"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Calendar, Clock, Tag, Flag, Repeat, List, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { DatePicker, QuickDatePicker } from "./DatePicker";
import { QuickDurationPicker } from "./TimeInput";
import { PriorityButtonGroup } from "./PrioritySelect";
import { QuickRecurrencePicker } from "./RecurrencePicker";
import { LabelPicker } from "@/components/tasks/TaskLabels";
import type { TaskFormData, Priority, Label as LabelType, List as ListType } from "@/lib/types";

interface TaskFormProps {
  initialData?: Partial<TaskFormData>;
  lists: ListType[];
  labels: LabelType[];
  onSubmit: (data: TaskFormData) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  mode?: "create" | "edit";
  className?: string;
}

export function TaskForm({
  initialData,
  lists,
  labels,
  onSubmit,
  onCancel,
  isSubmitting = false,
  mode = "create",
  className,
}: TaskFormProps) {
  const [name, setName] = React.useState(initialData?.name || "");
  const [description, setDescription] = React.useState(initialData?.description || "");
  const [listId, setListId] = React.useState(initialData?.list_id || lists[0]?.id || "");
  const [date, setDate] = React.useState<string | null>(initialData?.date || null);
  const [deadline, setDeadline] = React.useState<string | null>(initialData?.deadline || null);
  const [estimateMinutes, setEstimateMinutes] = React.useState<number | null>(initialData?.estimate_minutes || null);
  const [priority, setPriority] = React.useState<Priority>(initialData?.priority || "none");
  const [recurringRule, setRecurringRule] = React.useState<string | null>(initialData?.recurring_rule || null);
  const [selectedLabels, setSelectedLabels] = React.useState<string[]>(initialData?.labels || []);
  const [showAdvanced, setShowAdvanced] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSubmit({
      name: name.trim(),
      description: description.trim() || null,
      list_id: listId,
      date,
      deadline,
      estimate_minutes: estimateMinutes,
      priority,
      recurring_rule: recurringRule,
      labels: selectedLabels,
    });
  };

  const handleLabelToggle = (labelId: string) => {
    setSelectedLabels((prev) =>
      prev.includes(labelId)
        ? prev.filter((id) => id !== labelId)
        : [...prev, labelId]
    );
  };

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-4", className)}>
      {/* Task name */}
      <div className="space-y-2">
        <Label htmlFor="task-name">Task name</Label>
        <Input
          id="task-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="What needs to be done?"
          autoFocus
          disabled={isSubmitting}
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="task-description">Description</Label>
        <Textarea
          id="task-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add more details..."
          rows={3}
          disabled={isSubmitting}
        />
      </div>

      {/* List selector */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <List className="size-4" />
          List
        </Label>
        <div className="flex flex-wrap gap-1">
          {lists.map((list) => (
            <Button
              key={list.id}
              type="button"
              variant={listId === list.id ? "default" : "outline"}
              size="sm"
              onClick={() => setListId(list.id)}
              disabled={isSubmitting}
              className="text-xs"
            >
              {list.emoji && <span className="mr-1">{list.emoji}</span>}
              {list.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Date and time */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Calendar className="size-4" />
          Due date
        </Label>
        <QuickDatePicker
          value={date ? new Date(date) : null}
          onChange={(d) => setDate(d ? d.toISOString() : null)}
        />
      </div>

      {/* Priority */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Flag className="size-4" />
          Priority
        </Label>
        <PriorityButtonGroup
          value={priority}
          onChange={setPriority}
          disabled={isSubmitting}
          size="sm"
        />
      </div>

      {/* Labels */}
      {labels.length > 0 && (
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Tag className="size-4" />
            Labels
          </Label>
          <LabelPicker
            labels={labels}
            selectedIds={selectedLabels}
            onToggle={handleLabelToggle}
          />
        </div>
      )}

      {/* Advanced options toggle */}
      <button
        type="button"
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <span>{showAdvanced ? "Hide" : "Show"} advanced options</span>
      </button>

      {/* Advanced options */}
      {showAdvanced && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="space-y-4 overflow-hidden"
        >
          <Separator />

          {/* Time estimate */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Clock className="size-4" />
              Time estimate
            </Label>
            <QuickDurationPicker
              value={estimateMinutes}
              onChange={setEstimateMinutes}
            />
          </div>

          {/* Recurrence */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Repeat className="size-4" />
              Repeat
            </Label>
            <QuickRecurrencePicker
              value={recurringRule}
              onChange={setRecurringRule}
            />
          </div>

          {/* Deadline */}
          <div className="space-y-2">
            <Label>Deadline</Label>
            <DatePicker
              value={deadline ? new Date(deadline) : null}
              onChange={(d) => setDeadline(d ? d.toISOString() : null)}
              placeholder="Set a deadline"
              showTime
            />
          </div>
        </motion.div>
      )}

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
          {isSubmitting ? (
            "Saving..."
          ) : mode === "create" ? (
            <>
              <Plus className="size-4 mr-1" />
              Add Task
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </div>
    </form>
  );
}

// Inline quick add form
export function TaskFormInline({
  listId: _listId,
  onSubmit,
  className,
}: {
  listId?: string;
  onSubmit: (name: string) => void;
  className?: string;
}) {
  const [name, setName] = React.useState("");
  const [isExpanded, setIsExpanded] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit(name.trim());
    setName("");
    setIsExpanded(false);
  };

  return (
    <form onSubmit={handleSubmit} className={cn("relative", className)}>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-muted-foreground"
        >
          <Plus className="size-4" />
        </Button>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Add a task..."
          className="flex-1 border-transparent bg-transparent hover:bg-accent/50 focus:bg-background focus:border-input"
        />
        {name.trim() && (
          <Button type="submit" size="sm">
            Add
          </Button>
        )}
      </div>
    </form>
  );
}
