"use client";

import * as React from "react";
import { motion, useInView, Variants, AnimatePresence } from "framer-motion";
import { prefersReducedMotion } from "@/lib/utils/view-transition";

interface SlideInProps {
  children: React.ReactNode;
  /** Direction to slide in from */
  from?: "left" | "right" | "top" | "bottom";
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
  /** Show/hide with animation */
  show?: boolean;
}

const getInitialPosition = (from: string, distance: number) => {
  switch (from) {
    case "left":
      return { x: -distance, opacity: 0 };
    case "right":
      return { x: distance, opacity: 0 };
    case "top":
      return { y: -distance, opacity: 0 };
    case "bottom":
      return { y: distance, opacity: 0 };
    default:
      return { x: -distance, opacity: 0 };
  }
};

/**
 * SlideIn animation wrapper
 * Animates children with a slide and fade from a specified direction
 */
export function SlideIn({
  children,
  from = "left",
  duration = 0.3,
  delay = 0,
  distance = 100,
  triggerOnce = true,
  className,
}: SlideInProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: triggerOnce, margin: "-50px" });
  const reducedMotion = prefersReducedMotion();

  // Skip animations if reduced motion is preferred
  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      initial={{ ...getInitialPosition(from, distance) }}
      animate={isInView ? { x: 0, y: 0, opacity: 1 } : getInitialPosition(from, distance)}
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
 * SlideIn with show/hide support via AnimatePresence
 */
export function SlideInPresence({
  children,
  show = true,
  from = "left",
  duration = 0.3,
  distance = 100,
  className,
}: SlideInProps) {
  const reducedMotion = prefersReducedMotion();

  if (reducedMotion) {
    return show ? <div className={className}>{children}</div> : null;
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ ...getInitialPosition(from, distance) }}
          animate={{ x: 0, y: 0, opacity: 1 }}
          exit={{ ...getInitialPosition(from, distance), opacity: 0 }}
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

/**
 * Slide panel for modals/drawers
 */
interface SlidePanelProps {
  children: React.ReactNode;
  isOpen: boolean;
  onClose?: () => void;
  /** Side from which panel slides in */
  side?: "left" | "right" | "top" | "bottom";
  /** Size of the panel */
  size?: "sm" | "md" | "lg" | "full";
  /** Custom className */
  className?: string;
  /** Show backdrop */
  backdrop?: boolean;
  /** Backdrop click handler */
  onBackdropClick?: () => void;
}

const sizeConfig = {
  left: {
    sm: "w-64",
    md: "w-80",
    lg: "w-96",
    full: "w-full",
  },
  right: {
    sm: "w-64",
    md: "w-80",
    lg: "w-96",
    full: "w-full",
  },
  top: {
    sm: "h-48",
    md: "h-64",
    lg: "h-96",
    full: "h-full",
  },
  bottom: {
    sm: "h-48",
    md: "h-64",
    lg: "h-96",
    full: "h-full",
  },
};

export function SlidePanel({
  children,
  isOpen,
  side = "right",
  size = "md",
  className,
  backdrop = true,
  onBackdropClick,
}: SlidePanelProps) {
  const reducedMotion = prefersReducedMotion();

  const panelVariants: Variants = {
    hidden: {
      ...getInitialPosition(side, 100),
    },
    visible: {
      x: 0,
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
      },
    },
    exit: {
      ...getInitialPosition(side, 100),
      transition: {
        duration: 0.2,
        ease: "easeIn",
      },
    },
  };

  const backdropVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
  };

  if (reducedMotion) {
    return isOpen ? (
      <div className={className}>
        {backdrop && (
          <div className="fixed inset-0 bg-black/50 z-40" onClick={onBackdropClick} />
        )}
        <div className={sizeConfig[side][size]}>{children}</div>
      </div>
    ) : null;
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          {backdrop && (
            <motion.div
              variants={backdropVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={onBackdropClick}
            />
          )}

          {/* Panel */}
          <motion.div
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`
              fixed z-50 bg-background shadow-xl
              ${side === "left" ? "left-0 top-0 h-full" : ""}
              ${side === "right" ? "right-0 top-0 h-full" : ""}
              ${side === "top" ? "top-0 left-0 w-full" : ""}
              ${side === "bottom" ? "bottom-0 left-0 w-full" : ""}
              ${sizeConfig[side][size]}
              ${className || ""}
            `}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default SlideIn;
