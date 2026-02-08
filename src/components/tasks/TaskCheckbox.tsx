"use client";

import * as React from "react";
import { motion, AnimatePresence, useSpring } from "framer-motion";
import { Check, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { prefersReducedMotion } from "@/lib/utils/view-transition";

interface TaskCheckboxProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeConfig = {
  sm: {
    container: "size-4",
    check: "size-2.5",
    ring: "size-8",
  },
  md: {
    container: "size-5",
    check: "size-3",
    ring: "size-10",
  },
  lg: {
    container: "size-6",
    check: "size-3.5",
    ring: "size-12",
  },
};

// Spring configuration for satisfying animations
const springConfig = {
  stiffness: 500,
  damping: 30,
  mass: 0.8,
};

export function TaskCheckbox({
  checked = false,
  onCheckedChange,
  disabled = false,
  size = "md",
  className,
}: TaskCheckboxProps) {
  const config = sizeConfig[size];
  const reducedMotion = prefersReducedMotion();

  return (
    <motion.button
      type="button"
      role="checkbox"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange?.(!checked)}
      whileHover={disabled || reducedMotion ? undefined : { scale: 1.1 }}
      whileTap={disabled || reducedMotion ? undefined : { scale: 0.9 }}
      className={cn(
        "relative flex items-center justify-center rounded-full border-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        config.container,
        checked
          ? "border-primary bg-primary text-primary-foreground"
          : "border-muted-foreground/30 hover:border-primary/50",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <AnimatePresence mode="wait">
        {checked && (
          <motion.div
            key="check"
            initial={reducedMotion ? false : { scale: 0, rotate: -180, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={reducedMotion ? { opacity: 0 } : { scale: 0, rotate: 180, opacity: 0 }}
            transition={{
              type: "spring",
              ...springConfig,
            }}
          >
            <Check className={cn("stroke-[3]", config.check)} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

// Animated checkbox with completion effect and ripple
export function TaskCheckboxAnimated({
  checked = false,
  onCheckedChange,
  disabled = false,
  size = "md",
  className,
}: TaskCheckboxProps) {
  const config = sizeConfig[size];
  const [isAnimating, setIsAnimating] = React.useState(false);
  const reducedMotion = prefersReducedMotion();
  
  // Spring-based scale for smoother animation
  const scale = useSpring(1, springConfig);

  const handleClick = () => {
    if (disabled) return;
    
    if (!checked && !reducedMotion) {
      setIsAnimating(true);
      scale.set(1.2);
      setTimeout(() => {
        scale.set(1);
        setIsAnimating(false);
      }, 300);
    }
    
    onCheckedChange?.(!checked);
  };

  return (
    <div className="relative">
      {/* Ripple effect */}
      <AnimatePresence>
        {isAnimating && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0.6 }}
            animate={{ scale: 2.5, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className={cn(
              "absolute inset-0 rounded-full bg-primary pointer-events-none",
              config.container
            )}
            style={{ margin: "auto" }}
          />
        )}
      </AnimatePresence>

      {/* Particles effect */}
      <AnimatePresence>
        {isAnimating && (
          <>
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  scale: 0, 
                  opacity: 1,
                  x: 0,
                  y: 0,
                }}
                animate={{
                  scale: [0, 1, 0],
                  opacity: [1, 1, 0],
                  x: Math.cos((i * Math.PI * 2) / 6) * 20,
                  y: Math.sin((i * Math.PI * 2) / 6) * 20,
                }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="absolute inset-0 m-auto size-1.5 rounded-full bg-primary pointer-events-none"
              />
            ))}
          </>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        role="checkbox"
        aria-checked={checked}
        disabled={disabled}
        onClick={handleClick}
        style={{ scale }}
        whileHover={disabled || reducedMotion ? undefined : { scale: 1.15 }}
        className={cn(
          "relative flex items-center justify-center rounded-full border-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          config.container,
          checked
            ? "border-primary bg-primary text-primary-foreground"
            : "border-muted-foreground/30 hover:border-primary/50",
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}
      >
        <AnimatePresence mode="wait">
          {checked && (
            <motion.div
              initial={reducedMotion ? false : { scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={reducedMotion ? { opacity: 0 } : { scale: 0, rotate: 180 }}
              transition={{
                type: "spring",
                ...springConfig,
              }}
            >
              <Check className={cn("stroke-[3]", config.check)} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}

// Checkbox with priority color and enhanced animations
export function TaskCheckboxPriority({
  checked = false,
  onCheckedChange,
  disabled = false,
  size = "md",
  priority = "none",
  className,
}: TaskCheckboxProps & { priority?: "high" | "medium" | "low" | "none" }) {
  const config = sizeConfig[size];
  const [isAnimating, setIsAnimating] = React.useState(false);
  const reducedMotion = prefersReducedMotion();
  
  const priorityColors = {
    high: "border-priority-high hover:border-priority-high",
    medium: "border-priority-medium hover:border-priority-medium",
    low: "border-priority-low hover:border-priority-low",
    none: "border-muted-foreground/30 hover:border-primary/50",
  };

  const priorityBgColors = {
    high: "bg-priority-high",
    medium: "bg-priority-medium",
    low: "bg-priority-low",
    none: "bg-primary",
  };

  const handleClick = () => {
    if (disabled) return;
    
    if (!checked && !reducedMotion) {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 400);
    }
    
    onCheckedChange?.(!checked);
  };

  return (
    <div className="relative inline-flex">
      {/* Ripple effect */}
      <AnimatePresence>
        {isAnimating && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0.5 }}
            animate={{ scale: 2.5, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className={cn(
              "absolute rounded-full pointer-events-none",
              priorityBgColors[priority],
              config.ring
            )}
            style={{ 
              top: "50%", 
              left: "50%", 
              transform: "translate(-50%, -50%)" 
            }}
          />
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        role="checkbox"
        aria-checked={checked}
        disabled={disabled}
        onClick={handleClick}
        whileHover={disabled || reducedMotion ? undefined : { scale: 1.15 }}
        whileTap={disabled || reducedMotion ? undefined : { scale: 0.9 }}
        className={cn(
          "relative flex items-center justify-center rounded-full border-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          config.container,
          checked
            ? cn(priorityBgColors[priority], "text-white border-transparent")
            : priorityColors[priority],
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}
      >
        <AnimatePresence mode="wait">
          {checked && (
            <motion.div
              initial={reducedMotion ? false : { scale: 0, rotate: -180, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              exit={reducedMotion ? { opacity: 0 } : { scale: 0, rotate: 180, opacity: 0 }}
              transition={{
                type: "spring",
                ...springConfig,
              }}
            >
              <Check className={cn("stroke-[3]", config.check)} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}

// Double-check for completed tasks (visual indicator)
export function TaskCheckboxDouble({
  checked = false,
  onCheckedChange,
  disabled = false,
  size = "md",
  className,
}: TaskCheckboxProps) {
  const config = sizeConfig[size];
  const reducedMotion = prefersReducedMotion();

  return (
    <motion.button
      type="button"
      role="checkbox"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange?.(!checked)}
      whileHover={disabled || reducedMotion ? undefined : { scale: 1.1 }}
      whileTap={disabled || reducedMotion ? undefined : { scale: 0.9 }}
      className={cn(
        "relative flex items-center justify-center rounded-full border-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        config.container,
        checked
          ? "border-success bg-success text-success-foreground"
          : "border-muted-foreground/30 hover:border-primary/50",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <AnimatePresence mode="wait">
        {checked && (
          <motion.div
            initial={reducedMotion ? false : { scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={reducedMotion ? { opacity: 0 } : { scale: 0, opacity: 0 }}
            transition={{
              type: "spring",
              ...springConfig,
            }}
          >
            <CheckCheck className={cn("stroke-[3]", config.check)} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

export default TaskCheckbox;
