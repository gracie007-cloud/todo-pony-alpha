"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { XIcon } from "lucide-react"
import { Dialog as DialogPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { prefersReducedMotion } from "@/lib/utils/view-transition"

function Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

// Animation variants
const overlayVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.2, ease: "easeOut" as const }
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.15, ease: "easeIn" as const }
  },
}

const contentVariants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: 10,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 350,
      damping: 30,
    }
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 10,
    transition: {
      duration: 0.15,
      ease: "easeIn" as const
    }
  },
}

function DialogOverlay({
  className,
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  const reducedMotion = prefersReducedMotion()
  
  return (
    <motion.div
      data-slot="dialog-overlay"
      variants={reducedMotion ? undefined : overlayVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={cn(
        "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm",
        className
      )}
    />
  )
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  onOpenAutoFocus,
  onCloseAutoFocus,
  onEscapeKeyDown,
  onPointerDownOutside,
  forceMount,
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean
}) {
  const reducedMotion = prefersReducedMotion()
  
  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      <DialogPrimitive.Content
        asChild
        forceMount={forceMount}
        onOpenAutoFocus={onOpenAutoFocus}
        onCloseAutoFocus={onCloseAutoFocus}
        onEscapeKeyDown={onEscapeKeyDown}
        onPointerDownOutside={onPointerDownOutside}
      >
        <motion.div
          data-slot="dialog-content"
          variants={reducedMotion ? undefined : contentVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className={cn(
            "fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border bg-background p-6 shadow-lg outline-none sm:max-w-lg",
            "view-transition-dialog",
            className
          )}
        >
          {children}
          {showCloseButton && (
            <DialogPrimitive.Close
              data-slot="dialog-close"
              className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 btn-press"
            >
              <XIcon />
              <span className="sr-only">Close</span>
            </DialogPrimitive.Close>
          )}
        </motion.div>
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

// Animated dialog wrapper for use with AnimatePresence
function DialogAnimated({
  isOpen,
  children,
  ...props
}: { isOpen: boolean } & React.ComponentProps<typeof Dialog>) {
  const reducedMotion = prefersReducedMotion()
  
  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog {...props}>
          {children}
        </Dialog>
      )}
    </AnimatePresence>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2 text-center sm:text-left", className)}
      {...props}
    />
  )
}

function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  showCloseButton?: boolean
}) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close asChild>
          <Button variant="outline">Close</Button>
        </DialogPrimitive.Close>
      )}
    </div>
  )
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("text-lg leading-none font-semibold", className)}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

// Sheet/Drawer component for mobile-friendly dialogs
function SheetContent({
  className,
  children,
  side = "right",
  showCloseButton = true,
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  side?: "left" | "right" | "top" | "bottom"
  showCloseButton?: boolean
}) {
  const reducedMotion = prefersReducedMotion()
  
  const sideVariants = {
    left: {
      hidden: { x: "-100%", opacity: 0 },
      visible: { x: 0, opacity: 1 },
      exit: { x: "-100%", opacity: 0 },
    },
    right: {
      hidden: { x: "100%", opacity: 0 },
      visible: { x: 0, opacity: 1 },
      exit: { x: "100%", opacity: 0 },
    },
    top: {
      hidden: { y: "-100%", opacity: 0 },
      visible: { y: 0, opacity: 1 },
      exit: { y: "-100%", opacity: 0 },
    },
    bottom: {
      hidden: { y: "100%", opacity: 0 },
      visible: { y: 0, opacity: 1 },
      exit: { y: "100%", opacity: 0 },
    },
  }
  
  const positionClasses = {
    left: "inset-y-0 left-0 h-full w-full max-w-sm",
    right: "inset-y-0 right-0 h-full w-full max-w-sm",
    top: "inset-x-0 top-0 h-auto max-h-[80vh] w-full",
    bottom: "inset-x-0 bottom-0 h-auto max-h-[80vh] w-full",
  }
  
  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      <motion.div
        data-slot="sheet-content"
        variants={reducedMotion ? undefined : sideVariants[side]}
        initial="hidden"
        animate="visible"
        exit="exit"
        transition={{
          type: "spring" as const,
          stiffness: 300,
          damping: 30,
        }}
        className={cn(
          "fixed z-50 bg-background shadow-lg outline-none",
          "border-l data-[side=left]:border-r data-[side=right]:border-l",
          positionClasses[side],
          className
        )}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            className="absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none btn-press"
          >
            <XIcon className="size-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </motion.div>
    </DialogPortal>
  )
}

export {
  Dialog,
  DialogAnimated,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
  SheetContent,
}
