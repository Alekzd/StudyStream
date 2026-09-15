"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type Language = "vi" | "en";

export const DICTIONARY = {
  vi: {
    // Brand & App
    app_title: "StudyStream OS",
    app_subtitle: "The Midnight Espresso Atelier — Trạm Làm Việc & Học Tập Chuyên Sâu",
    brand_tagline: "Không gian học & làm việc chuyên sâu cho người nghiện cà phê và công việc.",

    // Navigation
    nav_explore: "Khám phá trạm",
    nav_profile: "Hồ sơ kỷ luật",
    nav_create_server: "Tạo không gian mới",
    nav_channels: "Kênh phòng",
    nav_settings: "Thiết lập",
    nav_sign_out: "Đăng xuất",
    nav_back: "Quay lại",
    nav_home: "Trang chủ",
    nav_mobile_menu: "Menu không gian",

    // Pomodoro Chronograph
    pomo_work: "DEEP SPRINT",
    pomo_break: "COFFEE BREAK",
    pomo_paused: "TẠM DỪNG",
    pomo_idle: "SẴN SÀNG",
    pomo_cycle: "Chu kỳ",
    pomo_start_sprint: "Bắt đầu Sprint (50p)",
    pomo_start_break: "Nghỉ nạp cafe (10p)",
    pomo_pause: "Tạm dừng",
    pomo_resume: "Tiếp tục",
    pomo_skip: "Bỏ qua pha",
    pomo_reset: "Đặt lại đồng hồ",

    // Room & Workstation
    room_enter: "Vào Trạm Làm Việc",
    room_connecting: "Đang kết nối LiveKit...",
    room_leave: "Rời trạm",
    room_silent_notice: "🔇 Chế độ Im Lặng: Micro bị khóa cưỡng chế. Chỉ camera & gõ phím.",
    room_fullscreen_hint: "Nhấn F để toàn màn hình",
    room_fullscreen_title: "Toàn màn hình (F)",
    room_loading: "Đang tải trạm làm việc...",
    room_connect_error: "Không thể kết nối trạm. Vui lòng kiểm tra lại!",
    room_desk_mates: "Bạn cùng bàn",
    room_camera_on: "Camera BẬT",
    room_camera_off: "Camera TẮT",
    room_mic_on: "Micro BẬT",
    room_mic_off: "Micro TẮT",
    room_zero_distraction: "Chế độ không xao nhãng",

    // Soundscape
    soundscape_title: "Bộ Hòa Âm Espresso & Jazz",
    soundscape_subtitle: "Âm thanh thực tế tái hiện quán bar ngầm và máy pha cà phê.",
    sound_mute_all: "Tắt toàn bộ",
    sound_unmute_all: "Bật âm thanh",
    sound_presets: "Hòa Âm Gợi Ý",
    sound_espresso: "Máy Pha Cà Phê Espresso",
    sound_jazz: "Đĩa Than Jazz Cổ Điển",
    sound_rain: "Mưa Đêm Quán Bar",
    sound_keyboard: "Bàn Phím Cơ Tactile",
    sound_fireplace: "Lò Sưởi Gỗ Thông",
    sound_breeze: "Gió Đêm Tĩnh Lặng",
    preset_espresso_bar: "☕ Quầy Bar Espresso & Vinyl Jazz",
    preset_night_shift: "🌙 Ca Đêm Cày Cuốc (Espresso + Phím cơ)",
    preset_deep_rain: "🌧️ Mưa Rào & Đĩa Than Nhạc Jazz",

    // Sensory & HUD
    sensory_mode_on: "Chế độ Dịu Mắt: BẬT",
    sensory_mode_off: "Bật chế độ Dịu Mắt (Sensory Focus)",
    diagnostic_hud_title: "Bảng Chẩn Đoán Sandbox (HUD)",

    // Chat
    chat_title: "Trò Chuyện Trạm",
    chat_placeholder: "Nhắn tin trao đổi công việc...",
    chat_empty: "Chưa có tin nhắn. Chúc bạn một ca làm việc năng suất!",
    chat_send: "Gửi",

    // Profile & Streaks
    profile_title: "Hồ Sơ Kỷ Luật & Chuỗi Ngày Làm Việc",
    profile_subtitle: "Theo dõi tiến độ, số giờ tập trung thực tế và chuỗi ngày không bỏ cuộc.",
    profile_streak_days: "Chuỗi Kỷ Luật",
    profile_total_hours: "Tổng Giờ Làm Việc Sâu",
    profile_level: "Cấp Độ Workaholic",
    profile_heatmap_title: "Bản Đồ Nhiệt Cày Cuốc (12 Tuần Gần Nhất)",
    profile_leaderboard_title: "Bảng Phong Thần Kỷ Luật",
    profile_recent_sessions: "Phiên Làm Việc Gần Đây",
    profile_days_unit: "ngày",
    profile_hours_unit: "giờ",
    profile_mins_unit: "phút",

    // Explore & Spaces
    explore_title: "Khám Phá Các Không Gian Làm Việc",
    explore_subtitle: "Tham gia các trạm làm việc chuyên sâu hoặc tự thiết lập phòng riêng.",
    explore_empty: "Chưa có không gian nào. Hãy tạo trạm đầu tiên!",
    explore_members: "thành viên",
    explore_join: "Tham gia",

    // Banner & Customization
    banner_custom_badge: "The Midnight Espresso Atelier",
    banner_change_hint: "Hỗ trợ ảnh tĩnh/GIF nền trong /public/banners",
  },
  en: {
    // Brand & App
    app_title: "StudyStream OS",
    app_subtitle: "The Midnight Espresso Atelier — Deep Focus Workstation",
    brand_tagline: "High-density virtual study & co-working sanctuary for coffeeholics and deep workers.",

    // Navigation
    nav_explore: "Explore Stations",
    nav_profile: "Discipline Profile",
    nav_create_server: "New Workstation",
    nav_channels: "Channels & Rooms",
    nav_settings: "Settings",
    nav_sign_out: "Sign Out",
    nav_back: "Back",
    nav_home: "Home",
    nav_mobile_menu: "Station Menu",

    // Pomodoro Chronograph
    pomo_work: "DEEP SPRINT",
    pomo_break: "COFFEE BREAK",
    pomo_paused: "PAUSED",
    pomo_idle: "READY",
    pomo_cycle: "Cycle",
    pomo_start_sprint: "Start Sprint (50m)",
    pomo_start_break: "Coffee Break (10m)",
    pomo_pause: "Pause",
    pomo_resume: "Resume",
    pomo_skip: "Skip Phase",
    pomo_reset: "Reset Chrono",

    // Room & Workstation
    room_enter: "Enter Workstation",
    room_connecting: "Connecting LiveKit...",
    room_leave: "Leave Station",
    room_silent_notice: "🔇 Silent Focus: Microphone is muted by policy. Video & keystrokes only.",
    room_fullscreen_hint: "Press F for Fullscreen",
    room_fullscreen_title: "Fullscreen (F)",
    room_loading: "Loading workstation...",
    room_connect_error: "Unable to connect. Please check credentials!",
    room_desk_mates: "Desk Mates",
    room_camera_on: "Camera ON",
    room_camera_off: "Camera OFF",
    room_mic_on: "Mic ON",
    room_mic_off: "Mic OFF",
    room_zero_distraction: "Zero-Distraction Mode",

    // Soundscape
    soundscape_title: "Espresso & Jazz Soundscapes",
    soundscape_subtitle: "Pragmatic ambient audio capturing speakeasy jazz and espresso extraction.",
    sound_mute_all: "Mute All",
    sound_unmute_all: "Unmute Audio",
    sound_presets: "Curated Presets",
    sound_espresso: "Espresso Machine Extraction",
    sound_jazz: "Vintage Vinyl Jazz",
    sound_rain: "Night Rain on Bar Glass",
    sound_keyboard: "Tactile Mechanical Clack",
    sound_fireplace: "Pine Wood Hearth",
    sound_breeze: "Midnight Breeze",
    preset_espresso_bar: "☕ Espresso Bar & Vinyl Jazz",
    preset_night_shift: "🌙 Night Shift Sprint (Espresso + Keys)",
    preset_deep_rain: "🌧️ Heavy Rain & Turntable Jazz",

    // Sensory & HUD
    sensory_mode_on: "Eye Comfort: ON",
    sensory_mode_off: "Toggle Eye Comfort (Sensory Focus)",
    diagnostic_hud_title: "Sandbox Diagnostic HUD",

    // Chat
    chat_title: "Station Chat",
    chat_placeholder: "Send a focused message...",
    chat_empty: "No messages yet. Have a productive shift!",
    chat_send: "Send",

    // Profile & Streaks
    profile_title: "Discipline Profile & Work Log",
    profile_subtitle: "Field analytics for workaholics — tracking every hour of deep focus.",
    profile_streak_days: "Discipline Streak",
    profile_total_hours: "Total Deep Work",
    profile_level: "Workaholic Rank",
    profile_heatmap_title: "Deep Work Heatmap (Past 12 Weeks)",
    profile_leaderboard_title: "Discipline Leaderboard",
    profile_recent_sessions: "Recent Sessions",
    profile_days_unit: "days",
    profile_hours_unit: "hrs",
    profile_mins_unit: "mins",

    // Explore & Spaces
    explore_title: "Explore Workstations",
    explore_subtitle: "Join deep work communities or launch your private cohort station.",
    explore_empty: "No workstations found. Be the first to establish one!",
    explore_members: "members",
    explore_join: "Join Station",

    // Banner & Customization
    banner_custom_badge: "The Midnight Espresso Atelier",
    banner_change_hint: "Supports custom static / GIF backgrounds in /public/banners",
  },
} as const;

export type TranslationKey = keyof typeof DICTIONARY["vi"];

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("vi");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("studystream_lang") as Language;
      if (saved === "vi" || saved === "en") {
        setLanguageState(saved);
      }
    } catch {}
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem("studystream_lang", lang);
    } catch {}
  };

  const toggleLanguage = () => {
    setLanguage(language === "vi" ? "en" : "vi");
  };

  const t = (key: TranslationKey): string => {
    const dict = DICTIONARY[language];
    return dict[key] ?? DICTIONARY["en"][key] ?? key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
