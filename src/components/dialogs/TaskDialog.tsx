"use client";

import * as React from "react";
import {
  Calendar,
  Clock,
  Tag,
  Flag,
  Repeat,
  List,
  MoreHorizontal,
  Trash2,
  Edit,
  Copy,
  History,
} from "lucide-react";
import { TaskCheckboxPriority } from "@/components/tasks/TaskCheckbox";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PriorityBadge } from "@/components/tasks/PriorityBadge";
import { TaskDueDate, TaskTimeEstimate } from "@/components/tasks/TaskDueDate";
import { TaskLabels } from "@/components/tasks/TaskLabels";
import { SubtaskProgress, SubtaskChecklist } from "@/components/tasks/SubtaskProgress";
import type { TaskWithRelations } from "@/lib/types";

interface TaskDialogProps {
  task: TaskWithRelations | null;
  isOpen: boolean;
  onClose: () => void;
  onToggleComplete?: (id: string, completed: boolean) => void;
  onEdit?: (task: TaskWithRelations) => void;
  onDelete?: (id: string) => void;
  onDuplicate?: (task: TaskWithRelations) => void;
  onViewHistory?: (id: string) => void;
}

export function TaskDialog({
  task,
  isOpen,
  onClose,
  onToggleComplete,
  onEdit,
  onDelete,
  onDuplicate,
  onViewHistory,
}: TaskDialogProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editedName, setEditedName] = React.useState("");
  const [editedDescription, setEditedDescription] = React.useState("");

  React.useEffect(() => {
    if (task) {
      setEditedName(task.name);
      setEditedDescription(task.description || "");
    }
    setIsEditing(false);
  }, [task]);

  if (!task) return null;

  const completedSubtasks = task.subtasks.filter((s) => s.completed).length;
  const isOverdue = task.date && new Date(task.date) < new Date() && !task.completed;

  const handleSaveEdit = () => {
    if (editedName.trim()) {
      onEdit?.({
        ...task,
        name: editedName.trim(),
        description: editedDescription.trim() || null,
      });
      setIsEditing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 gap-0">
        <DialogHeader className="p-4 pb-0">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <TaskCheckboxPriority
                checked={task.completed}
                onCheckedChange={(checked) => onToggleComplete?.(task.id, checked)}
                priority={task.priority}
                size="lg"
              />
              
              {isEditing ? (
                <Input
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="text-lg font-semibold"
                  autoFocus
                />
              ) : (
                <DialogTitle
                  className={cn(
                    "text-lg font-semibold truncate",
                    task.completed && "line-through text-muted-foreground"
                  )}
                >
                  {task.name}
                </DialogTitle>
              )}
            </div>

            <div className="flex items-center gap-1">
              {isEditing ? (
                <>
                  <Button size="sm" onClick={handleSaveEdit}>
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    size="icon-xs"
                    variant="ghost"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit className="size-4" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon-xs" variant="ghost">
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onDuplicate?.(task)}>
                        <Copy className="size-4 mr-2" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onViewHistory?.(task.id)}>
                        <History className="size-4 mr-2" />
                        View History
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onDelete?.(task.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="size-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 max-h-[calc(90vh-8rem)]">
          <div className="p-4 space-y-4">
            {/* Description */}
            <div className="space-y-2">
              {isEditing ? (
                <Textarea
                  value={editedDescription}
                  onChange={(e) => setEditedDescription(e.target.value)}
                  placeholder="Add description..."
                  rows={3}
                />
              ) : (
                task.description && (
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {task.description}
                  </p>
                )
              )}
            </div>

            {/* Meta info */}
            <div className="flex flex-wrap gap-3 text-sm">
              {/* List */}
              <div className="flex items-center gap-1.5">
                <List className="size-4 text-muted-foreground" />
                <span
                  className="px-2 py-0.5 rounded-full text-xs font-medium"
                  style={{
                    backgroundColor: task.list.color + "20",
                    color: task.list.color,
                  }}
                >
                  {task.list.emoji && <span className="mr-1">{task.list.emoji}</span>}
                  {task.list.name}
                </span>
              </div>

              {/* Priority */}
              {task.priority !== "none" && (
                <div className="flex items-center gap-1.5">
                  <Flag className="size-4 text-muted-foreground" />
                  <PriorityBadge priority={task.priority} size="sm" />
                </div>
              )}

              {/* Due date */}
              {task.date && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="size-4 text-muted-foreground" />
                  <TaskDueDate
                    date={task.date}
                    isOverdue={!!isOverdue}
                    size="sm"
                    showIcon={false}
                  />
                </div>
              )}

              {/* Time estimate */}
              {task.estimate_minutes && (
                <div className="flex items-center gap-1.5">
                  <Clock className="size-4 text-muted-foreground" />
                  <TaskTimeEstimate
                    minutes={task.estimate_minutes}
                    actualMinutes={task.actual_minutes}
                    size="sm"
                  />
                </div>
              )}

              {/* Recurrence */}
              {task.recurring_rule && (
                <div className="flex items-center gap-1.5">
                  <Repeat className="size-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Recurring</span>
                </div>
              )}
            </div>

            {/* Labels */}
            {task.labels.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Tag className="size-4" />
                  <span>Labels</span>
                </div>
                <TaskLabels labels={task.labels} size="md" />
              </div>
            )}

            {/* Subtasks */}
            {task.subtasks.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Subtasks</span>
                  <SubtaskProgress
                    completed={completedSubtasks}
                    total={task.subtasks.length}
                    size="sm"
                  />
                </div>
                <SubtaskChecklist
                  subtasks={task.subtasks.map((s) => ({
                    id: s.id,
                    name: s.name,
                    completed: s.completed,
                  }))}
                  onToggle={(_id) => {
                    // Handle subtask toggle
                  }}
                />
              </div>
            )}

            <Separator />

            {/* Reminders section placeholder */}
            {task.reminders.length > 0 && (
              <div className="space-y-2">
                <span className="text-sm font-medium">Reminders</span>
                <div className="text-sm text-muted-foreground">
                  {task.reminders.length} reminder(s) set
                </div>
              </div>
            )}

            {/* Attachments section placeholder */}
            {task.attachments.length > 0 && (
              <div className="space-y-2">
                <span className="text-sm font-medium">Attachments</span>
                <div className="text-sm text-muted-foreground">
                  {task.attachments.length} file(s) attached
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="border-t p-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Created {new Date(task.created_at).toLocaleDateString()}
          </span>
          {task.completed && task.completed_at && (
            <span>
              Completed {new Date(task.completed_at).toLocaleDateString()}
            </span>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
