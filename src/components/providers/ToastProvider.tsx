"use client";

import { Toaster, toast } from "sonner";

// Custom toast wrapper with animations
export function ToastProvider() {
  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        unstyled: true,
        classNames: {
          toast: "group",
          title: "text-sm font-medium",
          description: "text-xs text-muted-foreground",
          actionButton: "bg-primary text-primary-foreground text-xs px-2 py-1 rounded",
          cancelButton: "bg-muted text-muted-foreground text-xs px-2 py-1 rounded",
          success: "toast-success",
          error: "toast-error",
          warning: "toast-warning",
          info: "toast-info",
        },
        style: {
          background: "hsl(var(--background))",
          color: "hsl(var(--foreground))",
          border: "1px solid hsl(var(--border))",
          borderRadius: "calc(var(--radius) - 2px)",
          padding: "12px 16px",
          boxShadow: "0 4px 12px -2px oklch(0 0 0 / 0.1)",
        },
      }}
      // Custom animation configuration
      duration={4000}
      gap={8}
      expand={false}
      closeButton
    />
  );
}

// Animated toast functions
export const animatedToast = {
  success: (message: string, description?: string) => {
    toast.success(message, {
      description,
      style: {
        background: "hsl(var(--background))",
        borderLeft: "4px solid oklch(0.65 0.18 145)",
      },
    });
  },
  
  error: (message: string, description?: string) => {
    toast.error(message, {
      description,
      style: {
        background: "hsl(var(--background))",
        borderLeft: "4px solid oklch(0.58 0.22 25)",
      },
    });
  },
  
  warning: (message: string, description?: string) => {
    toast.warning(message, {
      description,
      style: {
        background: "hsl(var(--background))",
        borderLeft: "4px solid oklch(0.75 0.15 85)",
      },
    });
  },
  
  info: (message: string, description?: string) => {
    toast.info(message, {
      description,
      style: {
        background: "hsl(var(--background))",
        borderLeft: "4px solid oklch(0.60 0.18 230)",
      },
    });
  },
  
  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string;
    }
  ) => {
    return toast.promise(promise, messages);
  },
  
  dismiss: (toastId?: string | number) => {
    toast.dismiss(toastId);
  },
};

export default ToastProvider;
