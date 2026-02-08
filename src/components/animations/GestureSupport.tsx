"use client";

import * as React from "react";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { Check, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { prefersReducedMotion } from "@/lib/utils/view-transition";

// Swipe action configuration
export interface SwipeAction {
  icon: React.ReactNode;
  label: string;
  color: string;
  bgColor: string;
  action: () => void;
  threshold?: number;
}

interface SwipeableRowProps {
  children: React.ReactNode;
  /** Left swipe actions (swipe right to reveal) */
  leftActions?: SwipeAction[];
  /** Right swipe actions (swipe left to reveal) */
  rightActions?: SwipeAction[];
  /** Callback when swipe gesture is triggered */
  onSwipeLeft?: () => void;
  /** Callback when swipe right is triggered */
  onSwipeRight?: () => void;
  /** Swipe threshold in pixels */
  threshold?: number;
  /** Custom className */
  className?: string;
  /** Enable haptic feedback on mobile */
  hapticFeedback?: boolean;
}

/**
 * SwipeableRow - A row component with swipe gestures for mobile
 * Supports left/right swipe actions with visual feedback
 */
export function SwipeableRow({
  children,
  leftActions = [],
  rightActions = [],
  onSwipeLeft,
  onSwipeRight,
  threshold = 100,
  className,
  hapticFeedback = true,
}: SwipeableRowProps) {
  const x = useMotionValue(0);
  const [_isDragging, setIsDragging] = React.useState(false);
  const reducedMotion = prefersReducedMotion();

  // Background color based on swipe direction
  const backgroundColor = useTransform(
    x,
    [-threshold * 2, -threshold, 0, threshold, threshold * 2],
    [
      rightActions[0]?.bgColor || "transparent",
      rightActions[0]?.bgColor || "transparent",
      "transparent",
      leftActions[0]?.bgColor || "transparent",
      leftActions[0]?.bgColor || "transparent",
    ]
  );

  // Icon opacity based on swipe progress
  const leftIconOpacity = useTransform(x, [0, threshold], [0, 1]);
  const rightIconOpacity = useTransform(x, [-threshold, 0], [1, 0]);

  // Icon scale based on swipe progress
  const leftIconScale = useTransform(x, [0, threshold], [0.5, 1]);
  const rightIconScale = useTransform(x, [-threshold, 0], [1, 0.5]);

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false);
    
    // Haptic feedback
    if (hapticFeedback && "vibrate" in navigator) {
      if (Math.abs(info.offset.x) > threshold) {
        navigator.vibrate(10);
      }
    }

    // Trigger actions based on swipe direction
    if (info.offset.x > threshold && onSwipeRight) {
      onSwipeRight();
    } else if (info.offset.x < -threshold && onSwipeLeft) {
      onSwipeLeft();
    }
  };

  // Skip animations if reduced motion is preferred
  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Background with action indicators */}
      <motion.div
        className="absolute inset-0 flex items-center justify-between px-4"
        style={{ backgroundColor }}
      >
        {/* Left action indicator */}
        {leftActions[0] && (
          <motion.div
            style={{ opacity: leftIconOpacity, scale: leftIconScale }}
            className="flex items-center gap-2 text-white"
          >
            {leftActions[0].icon}
            <span className="text-sm font-medium">{leftActions[0].label}</span>
          </motion.div>
        )}

        {/* Right action indicator */}
        {rightActions[0] && (
          <motion.div
            style={{ opacity: rightIconOpacity, scale: rightIconScale }}
            className="flex items-center gap-2 text-white"
          >
            <span className="text-sm font-medium">{rightActions[0].label}</span>
            {rightActions[0].icon}
          </motion.div>
        )}
      </motion.div>

      {/* Draggable content */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.3}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        style={{ x }}
        className="relative bg-background"
      >
        {children}
      </motion.div>
    </div>
  );
}

// Pre-configured swipeable task row
interface SwipeableTaskRowProps {
  children: React.ReactNode;
  onComplete?: () => void;
  onDelete?: () => void;
  isCompleted?: boolean;
  className?: string;
}

export function SwipeableTaskRow({
  children,
  onComplete,
  onDelete,
  isCompleted = false,
  className,
}: SwipeableTaskRowProps) {
  const leftActions: SwipeAction[] = onComplete
    ? [
        {
          icon: <Check className="size-5" />,
          label: isCompleted ? "Undo" : "Complete",
          color: "white",
          bgColor: "oklch(0.65 0.18 145)",
          action: onComplete,
        },
      ]
    : [];

  const rightActions: SwipeAction[] = onDelete
    ? [
        {
          icon: <Trash2 className="size-5" />,
          label: "Delete",
          color: "white",
          bgColor: "oklch(0.58 0.22 25)",
          action: onDelete,
        },
      ]
    : [];

  return (
    <SwipeableRow
      leftActions={leftActions}
      rightActions={rightActions}
      onSwipeRight={onComplete}
      onSwipeLeft={onDelete}
      className={className}
    >
      {children}
    </SwipeableRow>
  );
}

// Long press handler
interface LongPressProps {
  children: React.ReactNode;
  onLongPress: () => void;
  /** Duration in ms to trigger long press */
  duration?: number;
  /** Callback when press starts */
  onPressStart?: () => void;
  /** Callback when press ends */
  onPressEnd?: () => void;
  /** Custom className */
  className?: string;
}

export function LongPress({
  children,
  onLongPress,
  duration = 500,
  onPressStart,
  onPressEnd,
  className,
}: LongPressProps) {
  const [isPressed, setIsPressed] = React.useState(false);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const reducedMotion = prefersReducedMotion();

  const handlePressStart = () => {
    setIsPressed(true);
    onPressStart?.();

    timeoutRef.current = setTimeout(() => {
      // Haptic feedback
      if ("vibrate" in navigator) {
        navigator.vibrate(50);
      }
      onLongPress();
      setIsPressed(false);
    }, duration);
  };

  const handlePressEnd = () => {
    setIsPressed(false);
    onPressEnd?.();

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  return (
    <motion.div
      className={cn("touch-none", className)}
      animate={
        reducedMotion
          ? {}
          : {
              scale: isPressed ? 0.98 : 1,
            }
      }
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      onPointerDown={handlePressStart}
      onPointerUp={handlePressEnd}
      onPointerLeave={handlePressEnd}
    >
      {children}
    </motion.div>
  );
}

// Pull to refresh component
interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  /** Custom className */
  className?: string;
  /** Refresh indicator height */
  indicatorHeight?: number;
}

export function PullToRefresh({
  children,
  onRefresh,
  className,
  indicatorHeight = 60,
}: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const y = useMotionValue(0);
  const reducedMotion = prefersReducedMotion();

  // Indicator opacity and rotation based on pull distance
  const indicatorOpacity = useTransform(y, [0, indicatorHeight], [0, 1]);
  const indicatorRotation = useTransform(y, [0, indicatorHeight * 2], [0, 360]);
  // Indicator Y position - must be called before conditional return
  const indicatorY = useTransform(y, (val: number) => Math.min(val - indicatorHeight, 0));

  const handleDragEnd = async (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.y > indicatorHeight && !isRefreshing) {
      setIsRefreshing(true);
      
      // Haptic feedback
      if ("vibrate" in navigator) {
        navigator.vibrate(20);
      }

      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
  };

  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Refresh indicator */}
      <motion.div
        className="absolute top-0 left-0 right-0 flex items-center justify-center"
        style={{
          height: indicatorHeight,
          opacity: indicatorOpacity,
          y: indicatorY,
        }}
      >
        <motion.div
          style={{ rotate: indicatorRotation }}
          animate={isRefreshing ? { rotate: 360 } : undefined}
          transition={
            isRefreshing
              ? { duration: 1, repeat: Infinity, ease: "linear" }
              : undefined
          }
        >
          <svg
            className="size-6 text-primary"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M21 12a9 9 0 11-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
          </svg>
        </motion.div>
      </motion.div>

      {/* Content */}
      <motion.div
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0.5, bottom: 0 }}
        style={{ y }}
        onDragEnd={handleDragEnd}
      >
        {children}
      </motion.div>
    </div>
  );
}

// Pinch to zoom component
interface PinchToZoomProps {
  children: React.ReactNode;
  /** Minimum scale */
  minScale?: number;
  /** Maximum scale */
  maxScale?: number;
  /** Custom className */
  className?: string;
}

export function PinchToZoom({
  children,
  minScale: _minScale = 0.5,
  maxScale: _maxScale = 3,
  className,
}: PinchToZoomProps) {
  const scale = useMotionValue(1);
  const reducedMotion = prefersReducedMotion();

  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={cn("touch-pan-x touch-pan-y", className)}
      style={{ scale }}
    >
      {children}
    </motion.div>
  );
}

export default SwipeableRow;
