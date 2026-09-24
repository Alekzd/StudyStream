"use client";

import React, { createContext, useContext, useState } from "react";

export type Language = "vi" | "en";

export const DICTIONARY = {
  vi: {
    app_title: "StudyStream",
    app_subtitle: "Phòng học trực tuyến cùng nhau",
    brand_tagline: "Không gian học tập tập trung qua webcam & Pomodoro đồng bộ.",

    nav_explore: "Khám phá phòng",
    nav_profile: "Thống kê",
    nav_create_server: "Tạo phòng mới",
    nav_channels: "Danh sách phòng",
    nav_settings: "Cài đặt",
    nav_sign_out: "Đăng xuất",
    nav_back: "Quay lại",
    nav_home: "Trang chủ",
    nav_mobile_menu: "Menu",

    pomo_work: "TẬP TRUNG",
    pomo_break: "NGHỈ NGƠI",
    pomo_paused: "TẠM DỪNG",
    pomo_idle: "SẴN SÀNG",
    pomo_cycle: "Hiệp",
    pomo_start_sprint: "Bắt đầu học",
    pomo_start_break: "Nghỉ giải lao",
    pomo_pause: "Tạm dừng",
    pomo_resume: "Tiếp tục",
    pomo_skip: "Chuyển tiếp",
    pomo_reset: "Đặt lại",

    room_enter: "Vào phòng",
    room_connecting: "Đang kết nối...",
    room_leave: "Rời phòng",
    room_silent_notice: "Phòng im lặng: Micro bị tắt. Chỉ bật camera.",
    room_fullscreen_hint: "Nhấn F để toàn màn hình",
    room_fullscreen_title: "Toàn màn hình (F)",
    room_loading: "Đang tải phòng...",
    room_connect_error: "Không thể kết nối phòng. Vui lòng thử lại!",
    room_desk_mates: "Người cùng phòng",
    room_camera_on: "Bật Camera",
    room_camera_off: "Tắt Camera",
    room_mic_on: "Bật Mic",
    room_mic_off: "Tắt Mic",
    room_zero_distraction: "Tập trung tối đa",

    soundscape_title: "Âm thanh nền",
    soundscape_subtitle: "Âm thanh nhẹ nhàng giúp tăng tập trung.",
    sound_mute_all: "Tắt âm thanh",
    sound_unmute_all: "Bật âm thanh",
    sound_presets: "Gợi ý",
    sound_espresso: "Quán cà phê",
    sound_jazz: "Nhạc Jazz",
    sound_rain: "Tiếng mưa",
    sound_keyboard: "Bàn phím",
    sound_fireplace: "Lửa trại",
    sound_breeze: "Tiếng gió",
    preset_espresso_bar: "Cà phê & Jazz",
    preset_night_shift: "Cà phê & Bàn phím",
    preset_deep_rain: "Mưa & Nhạc Jazz",

    sensory_mode_on: "Chế độ Dịu Mắt: BẬT",
    sensory_mode_off: "Bật chế độ Dịu Mắt",
    diagnostic_hud_title: "Bảng chẩn đoán",

    chat_title: "Trò chuyện",
    chat_placeholder: "Nhắn tin trong phòng...",
    chat_empty: "Chưa có tin nhắn nào.",
    chat_send: "Gửi",

    profile_title: "Thống kê học tập",
    profile_subtitle: "Theo dõi thời gian tập trung và chuỗi ngày học liên tục.",
    profile_streak_days: "Chuỗi ngày",
    profile_total_hours: "Tổng thời gian",
    profile_level: "Cấp độ",
    profile_heatmap_title: "Lịch sử học tập (12 tuần)",
    profile_leaderboard_title: "Bảng xếp hạng chuỗi ngày",
    profile_recent_sessions: "Phiên học gần đây",
    profile_days_unit: "ngày",
    profile_hours_unit: "giờ",
    profile_mins_unit: "phút",

    explore_title: "Phòng học",
    explore_subtitle: "Chọn phòng học phù hợp để bắt đầu.",
    explore_empty: "Chưa có phòng học nào. Hãy tạo phòng đầu tiên!",
    explore_members: "người",
    explore_join: "Tham gia",

    banner_custom_badge: "StudyStream",
    banner_change_hint: "Hỗ trợ ảnh tĩnh/GIF nền trong /public/banners",
  },
  en: {
    app_title: "StudyStream",
    app_subtitle: "Virtual study rooms together",
    brand_tagline: "Focus together with webcam presence and synchronized Pomodoro.",

    nav_explore: "Explore Rooms",
    nav_profile: "Stats",
    nav_create_server: "New Room",
    nav_channels: "Rooms",
    nav_settings: "Settings",
    nav_sign_out: "Sign Out",
    nav_back: "Back",
    nav_home: "Home",
    nav_mobile_menu: "Menu",

    pomo_work: "FOCUS",
    pomo_break: "BREAK",
    pomo_paused: "PAUSED",
    pomo_idle: "READY",
    pomo_cycle: "Cycle",
    pomo_start_sprint: "Start Focus",
    pomo_start_break: "Take Break",
    pomo_pause: "Pause",
    pomo_resume: "Resume",
    pomo_skip: "Skip",
    pomo_reset: "Reset",

    room_enter: "Join Room",
    room_connecting: "Connecting...",
    room_leave: "Leave Room",
    room_silent_notice: "Silent room: Microphones are muted. Video only.",
    room_fullscreen_hint: "Press F for Fullscreen",
    room_fullscreen_title: "Fullscreen (F)",
    room_loading: "Loading room...",
    room_connect_error: "Unable to connect. Please try again!",
    room_desk_mates: "Participants",
    room_camera_on: "Camera ON",
    room_camera_off: "Camera OFF",
    room_mic_on: "Mic ON",
    room_mic_off: "Mic OFF",
    room_zero_distraction: "Focus Mode",

    soundscape_title: "Ambient Sounds",
    soundscape_subtitle: "Calming background sounds to help you focus.",
    sound_mute_all: "Mute",
    sound_unmute_all: "Unmute",
    sound_presets: "Presets",
    sound_espresso: "Cafe",
    sound_jazz: "Jazz",
    sound_rain: "Rain",
    sound_keyboard: "Keyboard",
    sound_fireplace: "Fireplace",
    sound_breeze: "Breeze",
    preset_espresso_bar: "Cafe & Jazz",
    preset_night_shift: "Cafe & Typing",
    preset_deep_rain: "Rain & Jazz",

    sensory_mode_on: "Eye Comfort: ON",
    sensory_mode_off: "Toggle Eye Comfort",
    diagnostic_hud_title: "Diagnostics",

    chat_title: "Room Chat",
    chat_placeholder: "Send a message...",
    chat_empty: "No messages yet.",
    chat_send: "Send",

    profile_title: "Study Stats",
    profile_subtitle: "Track your focus time and study streak.",
    profile_streak_days: "Day Streak",
    profile_total_hours: "Total Time",
    profile_level: "Level",
    profile_heatmap_title: "Activity (Past 12 Weeks)",
    profile_leaderboard_title: "Streak Leaderboard",
    profile_recent_sessions: "Recent Sessions",
    profile_days_unit: "days",
    profile_hours_unit: "hrs",
    profile_mins_unit: "mins",

    explore_title: "Study Rooms",
    explore_subtitle: "Join a room to study with others.",
    explore_empty: "No rooms found. Be the first to create one!",
    explore_members: "members",
    explore_join: "Join Room",

    banner_custom_badge: "StudyStream",
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
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("studystream_lang") as Language;
        if (saved === "vi" || saved === "en") return saved;
      } catch {}
    }
    return "en";
  });

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
