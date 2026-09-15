"use client";

import React, { useState, useEffect } from "react";

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
  const [bannerUrl, setBannerUrl] = useState<string>("/banners/espresso-jazz.svg");

  useEffect(() => {
    try {
      // Allow user to persist custom GIF or banner in localStorage
      const userCustom = localStorage.getItem("studystream_custom_bg");
      if (customSrc) {
        setBannerUrl(customSrc);
      } else if (userCustom) {
        setBannerUrl(userCustom);
      }
    } catch {}
  }, [customSrc]);

  return (
    <div className="relative w-full h-full min-h-full">
      {/* Background Image / GIF Layer */}
      <div
        className="pointer-events-none fixed inset-0 z-0 bg-cover bg-center bg-no-repeat transition-opacity duration-700"
        style={{
          backgroundImage: `url('${bannerUrl}')`,
          opacity: opacity,
        }}
      />

      {/* Dark Espresso Vignette & Dimming Filter to protect text contrast */}
      <div
        className={`pointer-events-none fixed inset-0 z-0 ${overlayClassName} backdrop-blur-[2px]`}
      />

      {/* Foreground Content */}
      <div className="relative z-10 w-full h-full flex flex-col">
        {children}
      </div>
    </div>
  );
}
