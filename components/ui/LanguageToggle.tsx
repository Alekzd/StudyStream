"use client";

import React from "react";
import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";

interface LanguageToggleProps {
  className?: string;
  variant?: "pill" | "compact";
}

export function LanguageToggle({ className, variant = "pill" }: LanguageToggleProps) {
  const { language, setLanguage } = useLanguage();

  if (variant === "compact") {
    return (
      <button
        onClick={() => setLanguage(language === "vi" ? "en" : "vi")}
        className={cn(
          "px-2 py-1 rounded-md text-xs font-mono font-bold tracking-wider transition-all duration-200",
          "border border-espresso-700 bg-espresso-900 text-brass-500 hover:border-brass-500/40 hover:text-crema-50",
          className
        )}
        title={language === "vi" ? "Chuyển sang English" : "Switch to Tiếng Việt"}
      >
        {language.toUpperCase()}
      </button>
    );
  }

  return (
    <div
      className={cn(
        "inline-flex items-center p-0.5 rounded-lg bg-espresso-900 border border-espresso-700/80 text-xs font-mono select-none",
        className
      )}
    >
      <button
        onClick={() => setLanguage("vi")}
        className={cn(
          "px-2.5 py-1 rounded-md transition-all duration-200 font-semibold",
          language === "vi"
            ? "bg-espresso-750 text-brass-400 shadow-sm border border-espresso-600"
            : "text-crema-600 hover:text-crema-200"
        )}
      >
        VIE
      </button>
      <button
        onClick={() => setLanguage("en")}
        className={cn(
          "px-2.5 py-1 rounded-md transition-all duration-200 font-semibold",
          language === "en"
            ? "bg-espresso-750 text-brass-400 shadow-sm border border-espresso-600"
            : "text-crema-600 hover:text-crema-200"
        )}
      >
        ENG
      </button>
    </div>
  );
}
