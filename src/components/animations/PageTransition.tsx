"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { prefersReducedMotion } from "@/lib/utils/view-transition";

interface PageTransitionProps {
  children: React.ReactNode;
  /** Animation variant to use */
  variant?: "fade" | "slide" | "slideUp" | "scale";
  /** Duration in seconds */
  duration?: number;
  /** Delay before animation starts */
  delay?: number;
  /** Custom className */
  className?: string;
}

const variants = {
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  slide: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  },
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  },
  scale: {
    initial: { opacity: 0, scale: 0.98 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.98 },
  },
};

/**
 * Page transition wrapper for route changes
 * Uses AnimatePresence for exit animations
 */
export function PageTransition({
  children,
  variant = "fade",
  duration = 0.2,
  delay = 0,
  className,
}: PageTransitionProps) {
  const pathname = usePathname();
  const reducedMotion = prefersReducedMotion();

  // Skip animations if reduced motion is preferred
  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={variants[variant]}
        transition={{
          duration,
          delay,
          ease: [0.25, 0.1, 0.25, 1],
        }}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Simple presence wrapper for conditional rendering with animation
 */
export function PresenceTransition({
  children,
  show,
  variant = "fade",
  duration = 0.2,
  className,
}: PageTransitionProps & { show: boolean }) {
  const reducedMotion = prefersReducedMotion();

  if (reducedMotion) {
    return show ? <div className={className}>{children}</div> : null;
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial="initial"
          animate="animate"
          exit="exit"
          variants={variants[variant]}
          transition={{
            duration,
            ease: [0.25, 0.1, 0.25, 1],
          }}
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default PageTransition;
