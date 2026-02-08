"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import { motion, HTMLMotionProps } from "framer-motion";

import { cn } from "@/lib/utils";
import { prefersReducedMotion } from "@/lib/utils/view-transition";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        xs: "h-6 gap-1 rounded-md px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-xs": "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

// Animation variants for the button
const motionVariants = {
  initial: { scale: 1 },
  hover: { scale: 1.02 },
  tap: { scale: 0.98 },
};

interface ButtonProps
  extends Omit<HTMLMotionProps<"button">, "children">,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  children?: React.ReactNode;
  /** Enable/disable animations */
  animated?: boolean;
  /** Show loading state */
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "default",
      size = "default",
      asChild = false,
      animated = true,
      loading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const reducedMotion = prefersReducedMotion();
    const shouldAnimate = animated && !reducedMotion && !loading && !disabled;
    const Comp = asChild ? Slot.Root : "button";

    // If not animating, use regular button
    if (!shouldAnimate || asChild) {
      return (
        <Comp
          ref={ref}
          data-slot="button"
          data-variant={variant}
          data-size={size}
          className={cn(buttonVariants({ variant, size, className }))}
          disabled={disabled || loading}
          {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <motion.span
                className="size-4 border-2 border-current border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 0.75, repeat: Infinity, ease: "linear" }}
              />
              {children}
            </span>
          ) : (
            children
          )}
        </Comp>
      );
    }

    // Animated button with Framer Motion
    return (
      <motion.button
        ref={ref}
        data-slot="button"
        data-variant={variant}
        data-size={size}
        variants={motionVariants}
        initial="initial"
        whileHover="hover"
        whileTap="tap"
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 17,
        }}
        className={cn(buttonVariants({ variant, size, className }))}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <motion.span
              className="size-4 border-2 border-current border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 0.75, repeat: Infinity, ease: "linear" }}
            />
            {children}
          </span>
        ) : (
          children
        )}
      </motion.button>
    );
  }
);
Button.displayName = "Button";

// Icon button with rotation animation
interface IconButtonProps extends ButtonProps {
  /** Rotate icon on hover */
  rotateOnHover?: boolean;
  /** Rotation angle */
  rotateAngle?: number;
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ rotateOnHover = false, rotateAngle = 90, children, ...props }, ref) => {
    return (
      <Button ref={ref} {...props}>
        {rotateOnHover ? (
          <motion.span
            initial={{ rotate: 0 }}
            whileHover={{ rotate: rotateAngle }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="inline-flex"
          >
            {children}
          </motion.span>
        ) : (
          children
        )}
      </Button>
    );
  }
);
IconButton.displayName = "IconButton";

// Button with ripple effect
const RippleButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, className, ...props }, ref) => {
    const [ripples, setRipples] = React.useState<
      Array<{ x: number; y: number; id: number }>
    >([]);

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const id = Date.now();

      setRipples((prev) => [...prev, { x, y, id }]);

      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== id));
      }, 600);

      props.onClick?.(e as React.MouseEvent<HTMLButtonElement, MouseEvent>);
    };

    return (
      <Button
        ref={ref}
        className={cn("overflow-hidden relative", className)}
        onClick={handleClick}
        {...props}
      >
        {ripples.map((ripple) => (
          <motion.span
            key={ripple.id}
            initial={{ scale: 0, opacity: 0.5 }}
            animate={{ scale: 4, opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="absolute bg-current rounded-full size-5 pointer-events-none"
            style={{
              left: ripple.x - 10,
              top: ripple.y - 10,
            }}
          />
        ))}
        {children}
      </Button>
    );
  }
);
RippleButton.displayName = "RippleButton";

export { Button, IconButton, RippleButton, buttonVariants };
