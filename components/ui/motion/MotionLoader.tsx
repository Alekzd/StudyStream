"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { AppIcon } from "@/components/ui/Icon";

/**
 * 1. AtelierSpinner — Pure Vector SVG Spinning Ring
 * Isolated Framer Motion rotation. No globals.css keyframes.
 */
export function AtelierSpinner({
  size = 20,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      className={cn("text-brass-500 shrink-0", className)}
      animate={{ rotate: 360 }}
      transition={{
        repeat: Infinity,
        duration: 0.85,
        ease: "linear",
      }}
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.15" />
      <path
        d="M12 3a9 9 0 0 1 9 9"
        stroke="currentColor"
        strokeLinecap="round"
      />
    </motion.svg>
  );
}

/**
 * 2. CoffeePulse — Subtle luxury coffee emblem breathing animation
 */
export function CoffeePulse({
  size = 28,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      <motion.div
        className="absolute inset-0 rounded-full bg-brass-500/20 blur-md"
        animate={{
          scale: [0.85, 1.25, 0.85],
          opacity: [0.3, 0.7, 0.3],
        }}
        transition={{
          repeat: Infinity,
          duration: 2.2,
          ease: "easeInOut",
        }}
      />
      <motion.div
        animate={{
          scale: [1, 1.05, 1],
        }}
        transition={{
          repeat: Infinity,
          duration: 2.2,
          ease: "easeInOut",
        }}
        className="relative text-brass-400"
      >
        <AppIcon name="coffee" size={size} />
      </motion.div>
    </div>
  );
}

/**
 * 3. AtelierLoader — Full loading state for rooms, modals, and views
 */
export function AtelierLoader({
  label,
  sublabel,
  className,
  variant = "coffee",
}: {
  label?: string;
  sublabel?: string;
  className?: string;
  variant?: "coffee" | "spinner";
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "flex flex-col items-center justify-center gap-3 p-6 text-center select-none",
        className
      )}
    >
      {variant === "coffee" ? (
        <div className="w-14 h-14 rounded-2xl bg-espresso-900 border border-espresso-700/80 flex items-center justify-center shadow-lg shadow-black/40">
          <CoffeePulse size={26} />
        </div>
      ) : (
        <AtelierSpinner size={32} />
      )}

      {label && (
        <motion.p
          animate={{ opacity: [0.75, 1, 0.75] }}
          transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
          className="text-sm font-medium text-crema-200 font-sans tracking-tight"
        >
          {label}
        </motion.p>
      )}

      {sublabel && (
        <p className="text-xs font-mono text-crema-600 max-w-xs">{sublabel}</p>
      )}
    </motion.div>
  );
}

/**
 * 4. SkeletonPulse — Content placeholder shimmer without global CSS keyframes
 */
export function SkeletonPulse({
  className,
}: {
  className?: string;
}) {
  return (
    <motion.div
      animate={{
        opacity: [0.35, 0.65, 0.35],
      }}
      transition={{
        repeat: Infinity,
        duration: 1.5,
        ease: "easeInOut",
      }}
      className={cn("bg-espresso-850 rounded-xl", className)}
    />
  );
}
