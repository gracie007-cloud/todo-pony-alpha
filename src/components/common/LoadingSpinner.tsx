"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { prefersReducedMotion } from "@/lib/utils/view-transition";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "size-4",
  md: "size-6",
  lg: "size-8",
};

const strokeWidths = {
  sm: 2.5,
  md: 2.5,
  lg: 2,
};

export function LoadingSpinner({ size = "md", className }: LoadingSpinnerProps) {
  const reducedMotion = prefersReducedMotion();
  
  if (reducedMotion) {
    return (
      <div className={cn("relative", sizeClasses[size], className)}>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="size-full animate-spin"
        >
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth={strokeWidths[size]}
            className="text-muted/30"
          />
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth={strokeWidths[size]}
            strokeLinecap="round"
            strokeDasharray="40 60"
            className="text-primary"
          />
        </svg>
      </div>
    );
  }

  return (
    <motion.div
      className={cn("relative", sizeClasses[size], className)}
      animate={{ rotate: 360 }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: "linear",
      }}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="size-full"
      >
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth={strokeWidths[size]}
          className="text-muted/30"
        />
        <motion.circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth={strokeWidths[size]}
          strokeLinecap="round"
          className="text-primary"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 0.7 }}
          transition={{
            duration: 0.5,
            repeat: Infinity,
            repeatType: "loop",
          }}
          style={{
            strokeDasharray: "62.83",
            strokeDashoffset: "0",
          }}
        />
      </svg>
    </motion.div>
  );
}

// Dots variant
export function LoadingDots({ className }: { className?: string }) {
  const reducedMotion = prefersReducedMotion();
  
  return (
    <div className={cn("flex items-center gap-1", className)}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="size-1.5 rounded-full bg-current"
          initial={{ opacity: 0.3 }}
          animate={reducedMotion ? { opacity: 0.6 } : { opacity: 1 }}
          transition={
            reducedMotion
              ? { duration: 0 }
              : {
                  duration: 0.6,
                  repeat: Infinity,
                  repeatType: "reverse",
                  delay: i * 0.15,
                }
          }
        />
      ))}
    </div>
  );
}

// Pulse variant
export function LoadingPulse({ size = "md", className }: LoadingSpinnerProps) {
  const reducedMotion = prefersReducedMotion();
  
  return (
    <motion.div
      className={cn(
        "rounded-full bg-primary",
        sizeClasses[size],
        className
      )}
      animate={
        reducedMotion
          ? {}
          : {
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5],
            }
      }
      transition={{
        duration: 1.5,
        repeat: reducedMotion ? 0 : Infinity,
        ease: "easeInOut",
      }}
    />
  );
}

// Skeleton loader with shimmer effect
interface SkeletonProps {
  className?: string;
  animate?: boolean;
  variant?: "pulse" | "shimmer" | "none";
}

export function Skeleton({ 
  className, 
  animate = true,
  variant = "shimmer" 
}: SkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-md bg-muted",
        animate && variant === "pulse" && "animate-pulse",
        animate && variant === "shimmer" && "skeleton-shimmer",
        className
      )}
    />
  );
}

// Task card skeleton
export function TaskCardSkeleton({ className }: { className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-lg border bg-card p-3 space-y-3",
        className
      )}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox skeleton */}
        <Skeleton className="size-5 rounded-full" />
        
        {/* Content skeleton */}
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <div className="flex gap-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// List skeleton
export function ListSkeleton({ 
  count = 3,
  className 
}: { 
  count?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {[...Array(count)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
        >
          <TaskCardSkeleton />
        </motion.div>
      ))}
    </div>
  );
}

// Sidebar skeleton
export function SidebarSkeleton() {
  return (
    <div className="space-y-2 p-2">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-2 px-2 py-1.5">
          <Skeleton className="size-4 rounded" />
          <Skeleton className="h-4 flex-1" />
        </div>
      ))}
    </div>
  );
}

// Full page loader
export function PageLoader() {
  const reducedMotion = prefersReducedMotion();
  
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <motion.div
        className="flex flex-col items-center gap-4"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        <LoadingSpinner size="lg" />
        <motion.p
          className="text-sm text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: reducedMotion ? 0 : 0.3 }}
        >
          Loading...
        </motion.p>
      </motion.div>
    </div>
  );
}

// Inline loader for buttons and small spaces
export function InlineLoader({ className }: { className?: string }) {
  const reducedMotion = prefersReducedMotion();
  
  return (
    <motion.span
      className={cn("inline-block", className)}
      animate={reducedMotion ? {} : { opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 1.5, repeat: reducedMotion ? 0 : Infinity }}
    >
      ...
    </motion.span>
  );
}

// Content loader with fade-in transition
interface ContentLoaderProps {
  isLoading: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
  delay?: number;
}

export function ContentLoader({
  isLoading,
  children,
  fallback,
  className,
  delay = 0,
}: ContentLoaderProps) {
  const reducedMotion = prefersReducedMotion();
  
  return (
    <AnimatePresence mode="wait">
      {isLoading ? (
        <motion.div
          key="loading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className={className}
        >
          {fallback || <PageLoader />}
        </motion.div>
      ) : (
        <motion.div
          key="content"
          initial={reducedMotion ? {} : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            duration: 0.2, 
            delay: reducedMotion ? 0 : delay,
            ease: "easeOut" 
          }}
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Skeleton grid for dashboard-like layouts
export function SkeletonGrid({ 
  columns = 3, 
  rows = 2,
  className 
}: { 
  columns?: number;
  rows?: number;
  className?: string;
}) {
  return (
    <div 
      className={cn("grid gap-4", className)}
      style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
    >
      {[...Array(columns * rows)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="rounded-lg border bg-card p-4 space-y-3"
        >
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-3 w-3/4" />
        </motion.div>
      ))}
    </div>
  );
}

// Progress bar skeleton
export function ProgressSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex justify-between">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-8" />
      </div>
      <Skeleton className="h-2 w-full rounded-full" />
    </div>
  );
}

export default LoadingSpinner;
