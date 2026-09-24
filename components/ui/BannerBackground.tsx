"use client";

import React, { useState } from "react";

interface BannerBackgroundProps {
  customSrc?: string;
  opacity?: number; // 0 to 1
  overlayClassName?: string;
  children?: React.ReactNode;
}

export function BannerBackground({
  customSrc,
  opacity = 0.35,
  overlayClassName = "bg-gradient-to-b from-espresso-950/70 via-espresso-950/90 to-espresso-950",
  children,
}: BannerBackgroundProps) {
  const [bannerUrl] = useState<string>(() => {
    if (customSrc) return customSrc;
    if (typeof window !== "undefined") {
      try {
        const userCustom = localStorage.getItem("studystream_custom_bg");
        if (userCustom) return userCustom;
      } catch {}
    }
    return "/banners/espresso-jazz.svg";
  });

  return (
    <div className="relative w-full h-full min-h-full overflow-hidden">
      {/* Background Image / GIF Layer */}
      <div
        className="pointer-events-none absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transition-opacity duration-700"
        style={{
          backgroundImage: `url('${bannerUrl}')`,
          opacity: opacity,
        }}
      />

      <div
        className={`pointer-events-none absolute inset-0 z-0 ${overlayClassName}`}
      />

      {/* Foreground Content */}
      <div className="relative z-10 w-full h-full flex flex-col">
        {children}
      </div>
    </div>
  );
}
