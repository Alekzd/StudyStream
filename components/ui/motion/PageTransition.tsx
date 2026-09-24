"use client";

import React from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * 1. PageTransition — Smooth view entrance & exit container
 * Zero globals.css pollution. Pure Framer Motion transform & opacity.
 */
export function PageTransition({
  children,
  className,
  ...props
}: HTMLMotionProps<"div">) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{
        duration: 0.28,
        ease: [0.16, 1, 0.3, 1], // Luxury cubic-bezier curve
      }}
      className={cn("w-full h-full", className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * 2. StaggerContainer — Orchestrates staggered entrance for grids/lists
 */
export function StaggerContainer({
  children,
  className,
  delay = 0.05,
  ...props
}: HTMLMotionProps<"div"> & { delay?: number }) {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{
        hidden: { opacity: 0 },
        show: {
          opacity: 1,
          transition: {
            staggerChildren: delay,
          },
        },
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * 3. StaggerItem — Individual animated element inside a StaggerContainer
 */
export function StaggerItem({
  children,
  className,
  ...props
}: HTMLMotionProps<"div">) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 12, scale: 0.98 },
        show: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: {
            duration: 0.3,
            ease: [0.16, 1, 0.3, 1],
          },
        },
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}
