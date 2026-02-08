"use client";

import * as React from "react";
import { motion, useInView } from "framer-motion";
import { prefersReducedMotion } from "@/lib/utils/view-transition";

interface FadeInProps {
  children: React.ReactNode;
  /** Direction to fade in from */
  direction?: "up" | "down" | "left" | "right" | "none";
  /** Duration in seconds */
  duration?: number;
  /** Delay before animation starts */
  delay?: number;
  /** Distance to travel (in pixels) */
  distance?: number;
  /** Only animate when element comes into view */
  triggerOnce?: boolean;
  /** Custom className */
  className?: string;
  /** Margin for intersection observer (e.g., "-50px", "100px 0px") */
  margin?: `${number}px` | `${number}px ${number}px` | `${number}px ${number}px ${number}px ${number}px`;
}

const directionOffset: Record<string, { x?: number; y?: number }> = {
  up: { y: 20 },
  down: { y: -20 },
  left: { x: 20 },
  right: { x: -20 },
  none: {},
};

/**
 * FadeIn animation wrapper
 * Animates children with a fade and optional directional movement
 */
export function FadeIn({
  children,
  direction = "up",
  duration = 0.3,
  delay = 0,
  distance = 20,
  triggerOnce = true,
  className,
  margin = "-50px",
}: FadeInProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: triggerOnce, margin });
  const reducedMotion = prefersReducedMotion();

  // Calculate offset based on direction and distance
  const offset = React.useMemo(() => {
    const base = directionOffset[direction];
    if (direction === "up" || direction === "down") {
      return { y: base.y !== undefined ? (base.y > 0 ? distance : -distance) : 0 };
    }
    if (direction === "left" || direction === "right") {
      return { x: base.x !== undefined ? (base.x > 0 ? distance : -distance) : 0 };
    }
    return {};
  }, [direction, distance]);

  // Skip animations if reduced motion is preferred
  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, ...offset }}
      animate={isInView ? { opacity: 1, x: 0, y: 0 } : { opacity: 0, ...offset }}
      transition={{
        duration,
        delay,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Quick fade-in for immediate use (no viewport trigger)
 */
export function FadeInQuick({
  children,
  duration = 0.2,
  delay = 0,
  className,
}: Omit<FadeInProps, "direction" | "triggerOnce">) {
  const reducedMotion = prefersReducedMotion();

  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{
        duration,
        delay,
        ease: "easeOut",
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default FadeIn;
