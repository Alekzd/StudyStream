"use client";

import Link from "next/link";
import { AppIcon } from "@/components/ui/Icon";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { BannerBackground } from "@/components/ui/BannerBackground";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@clerk/nextjs";

export default function LandingPage() {
  const { t, language } = useLanguage();
  const { isSignedIn } = useAuth();

  return (
    <BannerBackground opacity={0.35}>
      <div className="flex flex-col min-h-dvh w-full select-none">
        {/* Navigation Bar */}
        <header className="w-full border-b border-espresso-700/80 bg-espresso-950/70 backdrop-blur-md sticky top-0 z-30">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-espresso-900 border border-espresso-700 flex items-center justify-center text-brass-500 shadow-sm">
                <AppIcon name="coffee" size={20} />
              </div>
              <span className="font-mono font-bold text-base sm:text-lg text-crema-100 tracking-tight">
                StudyStream <span className="text-brass-500 text-xs font-normal">OS</span>
              </span>
            </div>

            <div className="flex items-center gap-3">
              <LanguageToggle />
              <Link
                href={isSignedIn ? "/explore" : "/sign-in"}
                className="px-4 py-1.5 bg-brass-500 hover:bg-brass-600 text-espresso-950 text-xs font-mono font-bold rounded-xl transition-all shadow-sm"
              >
                {isSignedIn ? (language === "vi" ? "Vào Trạm" : "Launch App") : (language === "vi" ? "Đăng nhập" : "Sign In")}
              </Link>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-12 sm:py-20 text-center max-w-4xl mx-auto">
          {/* Atelier Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-espresso-900/90 border border-espresso-700/80 text-brass-400 text-xs font-mono mb-6 shadow-sm">
            <AppIcon name="sparkles" size={14} />
            <span>The Midnight Espresso Atelier</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold font-sans text-crema-100 tracking-tight leading-tight max-w-3xl mb-5">
            {language === "vi" ? (
              <>
                Không gian làm việc sâu <br />
                <span className="text-brass-400">cùng đĩa than Jazz & cà phê.</span>
              </>
            ) : (
              <>
                Deep focus sanctuary for <br />
                <span className="text-brass-400">coffeeholics & workaholics.</span>
              </>
            )}
          </h1>

          <p className="text-sm sm:text-lg text-crema-400 max-w-2xl leading-relaxed mb-8 sm:mb-10 font-sans">
            {t("brand_tagline")}
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full sm:w-auto">
            <Link
              href={isSignedIn ? "/explore" : "/sign-in"}
              className="w-full sm:w-auto px-8 py-3.5 bg-bourbon-500 hover:bg-bourbon-600 text-crema-50 font-bold rounded-xl text-sm sm:text-base font-mono transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
            >
              <AppIcon name="coffee" size={18} />
              <span>{language === "vi" ? "Vào Trạm Làm Việc Ngay" : "Enter Workstation"}</span>
            </Link>
            <Link
              href="/explore"
              className="w-full sm:w-auto px-6 py-3.5 bg-espresso-900 hover:bg-espresso-800 text-crema-200 border border-espresso-700 hover:border-brass-500/40 font-semibold rounded-xl text-sm sm:text-base font-mono transition-all flex items-center justify-center gap-2"
            >
              <AppIcon name="compass" size={18} />
              <span>{t("nav_explore")}</span>
            </Link>
          </div>

          {/* Core Pillars Feature Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-16 sm:mt-24 w-full text-left">
            <div className="p-5 rounded-2xl bg-espresso-900/80 border border-espresso-700/80 backdrop-blur-sm">
              <div className="w-10 h-10 rounded-xl bg-brass-500/10 border border-brass-500/30 flex items-center justify-center text-brass-400 mb-3.5">
                <AppIcon name="jazz" size={22} />
              </div>
              <h3 className="font-bold text-sm text-crema-100 mb-1.5">
                {language === "vi" ? "Espresso & Vinyl Jazz" : "Espresso & Vinyl Jazz"}
              </h3>
              <p className="text-xs text-crema-400 leading-relaxed">
                {language === "vi"
                  ? "Âm thanh máy nén cà phê, tiếng kim đĩa than và phím cơ tactile loại bỏ hoàn toàn lofi buồn ngủ."
                  : "Authentic coffee extraction, vinyl crackle and mechanical keystrokes replacing sleepy lofi."}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-espresso-900/80 border border-espresso-700/80 backdrop-blur-sm">
              <div className="w-10 h-10 rounded-xl bg-bourbon-500/10 border border-bourbon-500/30 flex items-center justify-center text-bourbon-500 mb-3.5">
                <AppIcon name="clock" size={22} />
              </div>
              <h3 className="font-bold text-sm text-crema-100 mb-1.5">
                {language === "vi" ? "Chronograph Pomodoro" : "Chronograph Pomodoro"}
              </h3>
              <p className="text-xs text-crema-400 leading-relaxed">
                {language === "vi"
                  ? "Bộ đếm nhịp giây chuẩn xác như đồng hồ cơ Thụy Sĩ, đồng bộ theo thời gian thực với toàn phòng."
                  : "Server-authoritative mechanical cadence clock keeping the entire desk in deep flow."}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-espresso-900/80 border border-espresso-700/80 backdrop-blur-sm">
              <div className="w-10 h-10 rounded-xl bg-patina-500/10 border border-patina-500/30 flex items-center justify-center text-patina-400 mb-3.5">
                <AppIcon name="videoOn" size={22} />
              </div>
              <h3 className="font-bold text-sm text-crema-100 mb-1.5">
                {language === "vi" ? "Body Doubling Tối Giản" : "Zero-Distraction Video"}
              </h3>
              <p className="text-xs text-crema-400 leading-relaxed">
                {language === "vi"
                  ? "Khung hình camera thích ứng LiveKit, triệt tiêu xao nhãng để bạn luôn thấy đồng đội đang nỗ lực."
                  : "LiveKit adaptive stream grid for peer accountability without distracting UI clutter."}
              </p>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="w-full border-t border-espresso-700/80 py-6 px-4 text-center text-xs font-mono text-crema-600">
          <p>StudyStream OS — Designed for Deep Workers & Coffeeholics.</p>
        </footer>
      </div>
    </BannerBackground>
  );
}
