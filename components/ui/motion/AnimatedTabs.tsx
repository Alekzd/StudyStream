"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface TabItem<T extends string = string> {
  id: T;
  label: React.ReactNode;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
}

export interface AnimatedTabsProps<T extends string = string> {
  tabs: TabItem<T>[];
  activeId: T;
  onChange: (id: T) => void;
  layoutId?: string;
  className?: string;
  tabClassName?: string;
  activePillClassName?: string;
  size?: "sm" | "md";
}

export function AnimatedTabs<T extends string = string>({
  tabs,
  activeId,
  onChange,
  layoutId = "active-tab-pill",
  className,
  tabClassName,
  activePillClassName,
  size = "md",
}: AnimatedTabsProps<T>) {
  return (
    <div
      role="tablist"
      className={cn(
        "relative inline-flex items-center p-1 rounded-xl bg-espresso-900 border border-espresso-750 select-none",
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = activeId === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              "relative z-10 inline-flex items-center justify-center font-medium transition-colors cursor-pointer rounded-lg",
              size === "sm"
                ? "px-2.5 py-1 text-xs"
                : "px-3.5 py-1.5 text-xs sm:text-sm",
              isActive
                ? "text-brass-300 font-semibold"
                : "text-crema-500 hover:text-crema-200",
              tabClassName
            )}
          >
            {isActive && (
              <motion.div
                layoutId={layoutId}
                transition={{
                  type: "spring",
                  stiffness: 450,
                  damping: 32,
                }}
                className={cn(
                  "absolute inset-0 bg-espresso-800 rounded-lg border border-espresso-650 shadow-sm",
                  activePillClassName
                )}
                style={{ zIndex: -1 }}
              />
            )}
            {tab.icon && <span className="mr-1.5 shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge && <span className="ml-1.5 shrink-0">{tab.badge}</span>}
          </button>
        );
      })}
    </div>
  );
}
