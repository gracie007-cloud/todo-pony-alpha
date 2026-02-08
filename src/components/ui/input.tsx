"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";

import { cn } from "@/lib/utils";
import { prefersReducedMotion } from "@/lib/utils/view-transition";

const Input = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<"input"> & {
    /** Enable focus animation */
    animatedFocus?: boolean;
  }
>(
  ({ className, type, animatedFocus = true, onFocus, onBlur, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false);
    const reducedMotion = prefersReducedMotion();

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      onBlur?.(e);
    };

    return (
      <div className="relative">
        <input
          type={type}
          data-slot="input"
          ref={ref}
          className={cn(
            "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
            "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
            className
          )}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />
        
        {/* Animated focus ring */}
        {animatedFocus && !reducedMotion && (
          <AnimatePresence>
            {isFocused && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute inset-0 rounded-md pointer-events-none ring-2 ring-ring/30"
              />
            )}
          </AnimatePresence>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

// Animated input with label
interface AnimatedInputProps extends React.ComponentProps<"input"> {
  label: string;
  /** Always show label above input */
  alwaysShowLabel?: boolean;
}

const AnimatedInput = React.forwardRef<HTMLInputElement, AnimatedInputProps>(
  ({ label, className, alwaysShowLabel = false, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false);
    const [hasValue, setHasValue] = React.useState(Boolean(props.value || props.defaultValue));
    const reducedMotion = prefersReducedMotion();

    const showLabel = alwaysShowLabel || isFocused || hasValue;

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      props.onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      setHasValue(Boolean(e.target.value));
      props.onBlur?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setHasValue(Boolean(e.target.value));
      props.onChange?.(e);
    };

    return (
      <div className="relative">
        <input
          {...props}
          ref={ref}
          data-slot="animated-input"
          className={cn(
            "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-12 w-full min-w-0 rounded-md border bg-transparent px-3 pt-5 pb-2 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
            "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
            className
          )}
          placeholder={showLabel ? props.placeholder : " "}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={handleChange}
        />
        
        {/* Floating label */}
        <motion.label
          initial={false}
          animate={{
            y: showLabel ? -8 : 0,
            scale: showLabel ? 0.85 : 1,
            color: isFocused 
              ? "oklch(0.45 0.18 260)" 
              : "oklch(0.50 0.02 260)",
          }}
          transition={
            reducedMotion
              ? { duration: 0 }
              : { type: "spring", stiffness: 300, damping: 25 }
          }
          className="absolute left-3 top-1/2 -translate-y-1/2 origin-left pointer-events-none text-muted-foreground"
        >
          {label}
        </motion.label>
      </div>
    );
  }
);
AnimatedInput.displayName = "AnimatedInput";

// Search input with animated icon
const SearchInput = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<"input"> & {
    /** Show loading state */
    loading?: boolean;
  }
>(({ className, loading, ...props }, ref) => {
  const [isFocused, setIsFocused] = React.useState(false);
  const reducedMotion = prefersReducedMotion();

  return (
    <div className="relative">
      <input
        {...props}
        ref={ref}
        type="search"
        data-slot="search-input"
        className={cn(
          "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent pl-9 pr-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
          className
        )}
        onFocus={(e) => {
          setIsFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          props.onBlur?.(e);
        }}
      />
      
      {/* Search icon */}
      <motion.div
        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        animate={{
          scale: isFocused ? 1.1 : 1,
          color: isFocused 
            ? "oklch(0.45 0.18 260)" 
            : "oklch(0.50 0.02 260)",
        }}
        transition={
          reducedMotion
            ? { duration: 0 }
            : { type: "spring", stiffness: 300, damping: 25 }
        }
      >
        {loading ? (
          <motion.div
            className="size-4 border-2 border-current border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 0.75, repeat: Infinity, ease: "linear" }}
          />
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        )}
      </motion.div>
    </div>
  );
});
SearchInput.displayName = "SearchInput";

export { Input, AnimatedInput, SearchInput };
