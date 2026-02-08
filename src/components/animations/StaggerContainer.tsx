"use client";

import * as React from "react";
import { motion, useInView, Variants } from "framer-motion";
import { prefersReducedMotion } from "@/lib/utils/view-transition";

interface StaggerContainerProps {
  children: React.ReactNode;
  /** Delay between each child animation (in seconds) */
  staggerDelay?: number;
  /** Duration of each child animation (in seconds) */
  childDuration?: number;
  /** Initial delay before starting (in seconds) */
  delay?: number;
  /** Direction children should animate from */
  direction?: "up" | "down" | "left" | "right";
  /** Distance children should travel */
  distance?: number;
  /** Only animate when container comes into view */
  triggerOnce?: boolean;
  /** Custom className */
  className?: string;
  /** Margin for intersection observer (e.g., "-50px", "100px 0px") */
  margin?: `${number}px` | `${number}px ${number}px` | `${number}px ${number}px ${number}px ${number}px`;
}

/**
 * StaggerContainer - Staggers the animation of its children
 * Children will animate in sequence with a delay between each
 */
export function StaggerContainer({
  children,
  staggerDelay = 0.05,
  childDuration = 0.3,
  delay = 0,
  direction = "up",
  distance = 20,
  triggerOnce = true,
  className,
  margin = "-50px",
}: StaggerContainerProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: triggerOnce, margin });
  const reducedMotion = prefersReducedMotion();

  // Child animation variants - calculate direction offset inline
  const childVariants: Variants = React.useMemo(() => {
    const directionOffset = (() => {
      switch (direction) {
        case "up":
          return { y: distance };
        case "down":
          return { y: -distance };
        case "left":
          return { x: distance };
        case "right":
          return { x: -distance };
        default:
          return { y: distance };
      }
    })();
    
    return {
      hidden: {
        opacity: 0,
        ...directionOffset,
      },
      visible: {
        opacity: 1,
        x: 0,
        y: 0,
        transition: {
          duration: childDuration,
          ease: [0.25, 0.1, 0.25, 1],
        },
      },
    };
  }, [childDuration, direction, distance]);

  // Container variants with custom stagger
  const customContainerVariants: Variants = React.useMemo(
    () => ({
      hidden: { opacity: 1 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: staggerDelay,
          delayChildren: delay,
        },
      },
    }),
    [staggerDelay, delay]
  );

  // Skip animations if reduced motion is preferred
  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      variants={customContainerVariants}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      className={className}
    >
      {React.Children.map(children, (child) => (
        <motion.div variants={childVariants}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}

/**
 * StaggerItem - Use inside StaggerContainer for individual items
 * This is optional - direct children of StaggerContainer will be animated
 */
export function StaggerItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={className}>{children}</div>;
}

/**
 * Simple staggered list for common use cases
 */
export function StaggerList<T>({
  items,
  renderItem,
  staggerDelay = 0.05,
  className,
  itemClassName,
}: {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  staggerDelay?: number;
  className?: string;
  itemClassName?: string;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const reducedMotion = prefersReducedMotion();

  const containerVariants: Variants = {
    hidden: { opacity: 1 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: [0.25, 0.1, 0.25, 1],
      },
    },
  };

  if (reducedMotion) {
    return (
      <div className={className}>
        {items.map((item, index) => (
          <div key={index} className={itemClassName}>
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    );
  }

  return (
    <motion.div
      ref={ref}
      variants={containerVariants}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      className={className}
    >
      {items.map((item, index) => (
        <motion.div key={index} variants={itemVariants} className={itemClassName}>
          {renderItem(item, index)}
        </motion.div>
      ))}
    </motion.div>
  );
}

export default StaggerContainer;
