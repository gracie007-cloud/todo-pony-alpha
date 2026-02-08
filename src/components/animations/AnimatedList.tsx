"use client";

import * as React from "react";
import { motion, AnimatePresence, LayoutGroup, Variants } from "framer-motion";
import { prefersReducedMotion } from "@/lib/utils/view-transition";

interface AnimatedListProps<T> {
  items: T[];
  getKey: (item: T) => string;
  renderItem: (item: T, index: number) => React.ReactNode;
  /** Animation variant for adding items */
  addAnimation?: "fade" | "slide" | "scale" | "grow";
  /** Animation variant for removing items */
  removeAnimation?: "fade" | "slide" | "scale" | "shrink";
  /** Duration of animations */
  duration?: number;
  /** Stagger delay between items */
  staggerDelay?: number;
  /** Custom className for container */
  className?: string;
  /** Custom className for items */
  itemClassName?: string;
  /** Enable layout animations for reordering */
  enableLayout?: boolean;
}

const animationVariants: Record<string, Variants> = {
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  slide: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  },
  scale: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 },
  },
  grow: {
    initial: { opacity: 0, scale: 0, height: 0 },
    animate: { 
      opacity: 1, 
      scale: 1, 
      height: "auto",
      transition: {
        height: { duration: 0.2 },
        opacity: { duration: 0.2 },
        scale: { type: "spring", stiffness: 400, damping: 25 },
      },
    },
    exit: { 
      opacity: 0, 
      scale: 0, 
      height: 0,
      transition: {
        height: { duration: 0.2 },
        opacity: { duration: 0.15 },
        scale: { duration: 0.2 },
      },
    },
  },
  shrink: {
    initial: { opacity: 0, height: 0 },
    animate: { opacity: 1, height: "auto" },
    exit: { 
      opacity: 0, 
      height: 0,
      margin: 0,
      padding: 0,
      transition: {
        height: { duration: 0.2 },
        opacity: { duration: 0.15 },
      },
    },
  },
};

/**
 * AnimatedList - A list component with smooth add/remove animations
 * Perfect for task lists, notifications, etc.
 */
export function AnimatedList<T>({
  items,
  getKey,
  renderItem,
  addAnimation = "slide",
  removeAnimation = "shrink",
  duration = 0.3,
  staggerDelay: _staggerDelay = 0,
  className,
  itemClassName,
  enableLayout = true,
}: AnimatedListProps<T>) {
  const reducedMotion = prefersReducedMotion();
  const [_prevItems, setPrevItems] = React.useState<T[]>(items);

  // Track added/removed items for special animations
  React.useEffect(() => {
    setPrevItems(items);
  }, [items]);

  // Get combined variants - explicitly typed to avoid complex union type inference
  const variants: Variants = {
    initial: animationVariants[addAnimation].initial,
    animate: {
      ...animationVariants[addAnimation].animate,
      transition: {
        duration,
        ease: [0.25, 0.1, 0.25, 1],
      },
    },
    exit: {
      ...animationVariants[removeAnimation].exit,
      transition: {
        duration: duration * 0.75,
        ease: "easeIn",
      },
    },
  };

  // Skip animations if reduced motion is preferred
  if (reducedMotion) {
    return (
      <div className={className}>
        {items.map((item, index) => (
          <div key={getKey(item)} className={itemClassName}>
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    );
  }

  const content = (
    <AnimatePresence mode="popLayout">
      {items.map((item, index) => (
        <motion.div
          key={getKey(item)}
          variants={variants}
          initial="initial"
          animate="animate"
          exit="exit"
          layout={enableLayout}
          className={itemClassName}
          style={{ overflow: "hidden" }}
        >
          {renderItem(item, index)}
        </motion.div>
      ))}
    </AnimatePresence>
  );

  // Wrap with LayoutGroup if layout animations are enabled
  if (enableLayout) {
    return <LayoutGroup><div className={className}>{content}</div></LayoutGroup>;
  }

  return <div className={className}>{content}</div>;
}

/**
 * AnimatedListItem - Individual item with animation support
 * Use this for more control over individual items
 */
interface AnimatedListItemProps {
  children: React.ReactNode;
  /** Unique key for the item */
  itemKey: string;
  /** Animation variant */
  variant?: "fade" | "slide" | "scale" | "grow";
  /** Duration of animation */
  duration?: number;
  /** Custom className */
  className?: string;
  /** Enable layout animation */
  layout?: boolean;
  /** Callback when animation completes */
  onAnimationComplete?: () => void;
}

export function AnimatedListItem({
  children,
  variant = "slide",
  duration = 0.3,
  className,
  layout = true,
  onAnimationComplete,
}: AnimatedListItemProps) {
  const reducedMotion = prefersReducedMotion();

  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  const variants = animationVariants[variant];

  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      layout={layout}
      transition={{ duration }}
      className={className}
      onAnimationComplete={onAnimationComplete}
      style={{ overflow: "hidden" }}
    >
      {children}
    </motion.div>
  );
}

/**
 * AnimatedListContainer - Container for animated list items
 * Provides staggered entrance for initial render
 */
interface AnimatedListContainerProps {
  children: React.ReactNode;
  /** Stagger delay between children */
  staggerDelay?: number;
  /** Custom className */
  className?: string;
}

export function AnimatedListContainer({
  children,
  staggerDelay = 0.05,
  className,
}: AnimatedListContainerProps) {
  const reducedMotion = prefersReducedMotion();

  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 1 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
      className={className}
    >
      {React.Children.map(children, (child) => (
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { 
              opacity: 1, 
              y: 0,
              transition: {
                duration: 0.3,
                ease: [0.25, 0.1, 0.25, 1],
              },
            },
          }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}

export default AnimatedList;
