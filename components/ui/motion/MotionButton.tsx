"use client";

import React, { forwardRef } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import { AtelierSpinner } from "./MotionLoader";

export type MotionButtonVariant =
  | "brass"
  | "bourbon"
  | "surface"
  | "outline"
  | "ghost"
  | "patina";

export type MotionButtonSize = "sm" | "md" | "lg" | "icon";

export interface MotionButtonProps
  extends Omit<HTMLMotionProps<"button">, "children"> {
  children?: React.ReactNode;
  variant?: MotionButtonVariant;
  size?: MotionButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantStyles: Record<MotionButtonVariant, string> = {
  brass:
    "bg-brass-500 hover:bg-brass-600 text-espresso-950 font-bold shadow-md shadow-brass-900/20 border border-brass-400/40",
  bourbon:
    "bg-bourbon-600 hover:bg-bourbon-700 text-crema-50 font-bold shadow-md shadow-bourbon-950/30 border border-bourbon-500/40",
  surface:
    "bg-espresso-850 hover:bg-espresso-800 text-crema-100 font-medium border border-espresso-700 hover:border-brass-500/40 shadow-sm",
  outline:
    "bg-transparent hover:bg-espresso-850/80 text-crema-200 hover:text-brass-300 border border-espresso-700 hover:border-brass-500/50",
  ghost:
    "bg-transparent hover:bg-espresso-800/60 text-crema-400 hover:text-crema-100",
  patina:
    "bg-patina-500 hover:bg-patina-600 text-crema-50 font-bold shadow-md shadow-patina-950/20 border border-patina-400/40",
};

const sizeStyles: Record<MotionButtonSize, string> = {
  sm: "h-8 px-3 text-xs rounded-lg gap-1.5",
  md: "h-10 px-4 text-sm rounded-xl gap-2",
  lg: "h-12 px-6 text-base rounded-2xl gap-2.5",
  icon: "h-9 w-9 p-0 rounded-xl justify-center",
};

export const MotionButton = forwardRef<HTMLButtonElement, MotionButtonProps>(
  (
    {
      children,
      className,
      variant = "surface",
      size = "md",
      isLoading = false,
      disabled = false,
      leftIcon,
      rightIcon,
      type = "button",
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <motion.button
        ref={ref}
        type={type}
        disabled={isDisabled}
        whileTap={isDisabled ? undefined : { scale: 0.96 }}
        whileHover={isDisabled ? undefined : { scale: 1.015 }}
        transition={{ type: "spring", stiffness: 450, damping: 25 }}
        className={cn(
          "relative inline-flex items-center justify-center select-none font-sans font-medium transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50",
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <AtelierSpinner size={size === "sm" ? 14 : 18} />
            {children && <span>{children}</span>}
          </span>
        ) : (
          <>
            {leftIcon && <span className="shrink-0 flex items-center">{leftIcon}</span>}
            {children && <span>{children}</span>}
            {rightIcon && <span className="shrink-0 flex items-center">{rightIcon}</span>}
          </>
        )}
      </motion.button>
    );
  }
);

MotionButton.displayName = "MotionButton";
