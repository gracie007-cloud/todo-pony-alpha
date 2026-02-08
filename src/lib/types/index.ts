import type {
  Task,
  List,
  Label,
  Subtask,
  Priority,
  ListWithTaskCount,
  TaskWithRelations,
  TaskHistory,
} from "@/lib/db/schema";

// Re-export schema types
export type {
  Task,
  List,
  Label,
  Subtask,
  Priority,
  ListWithTaskCount,
  TaskWithRelations,
  TaskHistory,
};

// Component prop types
export interface TaskCardProps {
  task: TaskWithRelations;
  onToggleComplete?: (id: string, completed: boolean) => void;
  onClick?: (task: TaskWithRelations) => void;
  isDragging?: boolean;
}

export interface TaskItemProps {
  task: Task;
  list?: List;
  labels?: Label[];
  subtaskCount?: number;
  completedSubtasks?: number;
  onToggleComplete?: (id: string, completed: boolean) => void;
  onClick?: (task: Task) => void;
}

export interface TaskListProps {
  tasks: TaskWithRelations[];
  groupBy?: "date" | "priority" | "list" | "none";
  onToggleComplete?: (id: string, completed: boolean) => void;
  onTaskClick?: (task: TaskWithRelations) => void;
  emptyMessage?: string;
}

export interface ListViewProps {
  list: ListWithTaskCount;
  isActive?: boolean;
  onClick?: () => void;
}

export interface ViewItemProps {
  id: string;
  label: string;
  icon: React.ReactNode;
  count?: number;
  isActive?: boolean;
  onClick?: () => void;
}

export interface LabelItemProps {
  label: Label;
  count?: number;
  isActive?: boolean;
  onClick?: () => void;
}

export interface PriorityBadgeProps {
  priority: Priority;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export interface TaskDueDateProps {
  date: string | Date | null;
  isOverdue?: boolean;
  showTime?: boolean;
}

export interface TaskLabelsProps {
  labels: Label[];
  maxVisible?: number;
  size?: "sm" | "md";
}

export interface SubtaskProgressProps {
  completed: number;
  total: number;
  size?: "sm" | "md" | "lg";
}

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export interface OverdueBadgeProps {
  count: number;
  onClick?: () => void;
}

export interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  presetColors?: string[];
}

export interface EmojiPickerProps {
  value: string | null;
  onChange: (emoji: string | null) => void;
}

export interface DatePickerProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  showTime?: boolean;
}

export interface TimeInputProps {
  value: string;
  onChange: (time: string) => void;
}

export interface PrioritySelectProps {
  value: Priority;
  onChange: (priority: Priority) => void;
}

export interface RecurrencePickerProps {
  value: string | null;
  onChange: (rule: string | null) => void;
}

// View types for navigation
export type ViewType = "today" | "next7days" | "all" | "completed" | "inbox";

export interface NavigationView {
  id: ViewType;
  label: string;
  icon: React.ReactNode;
  description?: string;
}

// Sidebar state
export interface SidebarState {
  isCollapsed: boolean;
  activeView: ViewType;
  activeListId: string | null;
  activeLabelId: string | null;
}

// Dialog state
export interface DialogState {
  taskDialog: {
    isOpen: boolean;
    taskId: string | null;
    mode: "create" | "edit" | "view";
  };
  listDialog: {
    isOpen: boolean;
    listId: string | null;
    mode: "create" | "edit";
  };
  labelDialog: {
    isOpen: boolean;
    labelId: string | null;
    mode: "create" | "edit";
  };
  deleteDialog: {
    isOpen: boolean;
    type: "task" | "list" | "label" | null;
    id: string | null;
    name: string;
  };
}

// Form types
export interface TaskFormData {
  name: string;
  description: string | null;
  list_id: string;
  date: string | null;
  deadline: string | null;
  estimate_minutes: number | null;
  priority: Priority;
  recurring_rule: string | null;
  labels: string[];
}

export interface ListFormData {
  name: string;
  color: string;
  emoji: string | null;
}

export interface LabelFormData {
  name: string;
  color: string;
  icon: string | null;
}

// Animation variants for Framer Motion
export const fadeInUp = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
};

export const slideInLeft = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

export const slideInRight = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
};

export const staggerContainer = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.05,
    },
  },
};

export const taskCardVariants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 350,
      damping: 25,
    },
  },
  exit: {
    opacity: 0,
    x: -100,
    transition: {
      duration: 0.2,
    },
  },
  hover: {
    scale: 1.01,
    transition: {
      type: "spring" as const,
      stiffness: 400,
      damping: 25,
    },
  },
};

export const checkboxVariants = {
  unchecked: { scale: 1 },
  checked: { 
    scale: [1, 1.2, 1],
    transition: {
      duration: 0.3,
    },
  },
};

export const sidebarVariants = {
  expanded: { width: 280 },
  collapsed: { width: 72 },
};

// Spring configurations
export const springConfig = {
  stiff: { stiffness: 400, damping: 30 },
  gentle: { stiffness: 200, damping: 25 },
  bouncy: { stiffness: 500, damping: 20 },
};
