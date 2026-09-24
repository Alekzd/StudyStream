"use client";

import React from "react";
import { useLanguage, type Language } from "@/context/LanguageContext";
import { AnimatedTabs, type TabItem } from "@/components/ui/motion/AnimatedTabs";
import { MotionButton } from "@/components/ui/motion/MotionButton";

interface LanguageToggleProps {
  className?: string;
  variant?: "pill" | "compact";
}

const LANG_TABS: TabItem<Language>[] = [
  { id: "vi", label: "VIE" },
  { id: "en", label: "ENG" },
];

export function LanguageToggle({ className, variant = "pill" }: LanguageToggleProps) {
  const { language, setLanguage } = useLanguage();

  if (variant === "compact") {
    return (
      <MotionButton
        size="sm"
        variant="outline"
        onClick={() => setLanguage(language === "vi" ? "en" : "vi")}
        className={className}
        title={language === "vi" ? "Chuyển sang English" : "Switch to Tiếng Việt"}
      >
        <span className="font-mono font-bold tracking-wider text-brass-400">
          {language.toUpperCase()}
        </span>
      </MotionButton>
    );
  }

  return (
    <AnimatedTabs
      tabs={LANG_TABS}
      activeId={language}
      onChange={(val) => setLanguage(val as Language)}
      layoutId="active-language-pill"
      size="sm"
      className={className}
    />
  );
}
