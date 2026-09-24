# StudyStream

> Nền tảng học tập ảo và phòng tự học nhóm trực tuyến (Virtual Study & Body Doubling Platform) xây dựng trên Next.js 15, Convex và LiveKit WebRTC.

[![CI](https://github.com/Alekzd/StudyStream/actions/workflows/ci.yml/badge.svg)](https://github.com/Alekzd/StudyStream/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js&logoColor=white)](https://nextjs.org/)
[![Convex](https://img.shields.io/badge/Convex-1.24+-F04D21?logo=convex&logoColor=white)](https://convex.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

---

## 1. Tính Năng Chính

- **Phòng Học Trực Tuyến (Multi-room Video Grid):** Học cùng nhau qua camera với chế độ adaptive simulcast tiết kiệm băng thông.
- **Đồng Hồ Pomodoro Tập Trung:** Đồng bộ chính xác theo thời gian thực từ server (`targetEndTime`), tự động chuyển ca học/nghỉ và phát chuông báo.
- **Bộ Âm Thanh Nền (Ambient Soundscape):** Hòa trộn âm thanh tiếng mưa, quán cà phê, thư viện, lửa trại và sóng biển giúp duy trì sự tập trung.
- **Hệ Thống Máy Chủ & Kênh Học (Server & Channel):** Phân chia không gian học tập theo nhóm, phòng yên lặng (`SILENT_FOCUS`), phòng thảo luận hoặc phòng tự do.
- **Thống Kê Tập Trung & Chuỗi Ngày:** Ghi nhận thời gian tập trung thực tế, chuỗi ngày liên tiếp (streak) và lịch sử học tập cá nhân.
- **Bảo Mật & RBAC:** Xác thực qua Clerk (Webhook HMAC signature), phân quyền Host/Admin, bảo vệ token LiveKit WebRTC cấp từ máy chủ.

---

## 2. Công Nghệ Sử Dụng

- **Frontend:** Next.js 15 (App Router, React 19, Server Components), TypeScript 5.
- **Styling:** Tailwind CSS v4 (Modern Color Tokens, Dark/OLED theme).
- **Backend & Database:** Convex (Serverless, reactive WebSocket DB, subscriptions).
- **Authentication:** Clerk + Svix Webhooks ingest.
- **WebRTC SFU:** LiveKit Cloud / Self-hosted LiveKit Server.
- **Audio Engine:** Howler.js (Ambient sound mixing).
- **Testing & CI:** Vitest, ESLint, GitHub Actions.

---

## 3. Cấu Trúc Dự Án

```text
studystream/
├── app/
│   ├── (auth)/                  # Clerk Sign-in & Sign-up
│   ├── (main)/                  # Ứng dụng chính sau đăng nhập
│   │   ├── servers/[serverId]/  # Không gian server & phòng học
│   │   ├── explore/             # Khám phá các phòng học đang mở
│   │   └── profile/             # Thống kê cá nhân & streak
│   ├── layout.tsx               # Root layout (Clerk + Convex Providers)
│   └── page.tsx                 # Landing page
├── components/
│   ├── layout/                  # Sidebar, BottomNav, Header
│   ├── pomodoro/                # PomodoroTimer, Controls
│   ├── room/                    # VideoGrid, RoomView, ChatDrawer
│   ├── server/                  # ChannelSidebar, CreateRoomModal
│   └── soundscape/              # SoundscapeMixer, AudioWidgets
├── convex/                      # Serverless backend functions & schema
├── hooks/                       # useSynchronizedPomodoro, useTrackVisibility
├── lib/                         # soundscape engine, utils, helpers
└── tests/                       # Unit tests (Vitest)
```

---

## 4. Hướng Dẫn Cài Đặt & Chạy Local

### Bước 1: Clone kho mã nguồn
```bash
git clone https://github.com/Alekzd/StudyStream.git
cd StudyStream
```

### Bước 2: Cài đặt thư viện phụ thuộc
```bash
npm install
```

### Bước 3: Cấu hình biến môi trường
Tạo file `.env.local` từ mẫu `.env.example`:
```bash
cp .env.example .env.local
```
Điền đầy đủ thông tin:
- Clerk: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SIGNING_SECRET`, `CLERK_JWT_ISSUER_DOMAIN`.
- Convex: `NEXT_PUBLIC_CONVEX_URL`, `CONVEX_DEPLOYMENT`.
- LiveKit: `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `NEXT_PUBLIC_LIVEKIT_WS_URL`.

### Bước 4: Khởi chạy Convex và Next.js
Mở terminal 1 (Convex Backend):
```bash
npx convex dev
```

Mở terminal 2 (Next.js Frontend):
```bash
npm run dev
```

Truy cập ứng dụng tại: `http://localhost:3000`.

---

## 5. Kiểm Thử & Kiểm Tra Chất Lượng Mã Nguồn

```bash
# Chạy toàn bộ 61 unit tests
npm run test:run

# Kiểm tra kiểu dữ liệu TypeScript
npm run typecheck

# Kiểm tra cú pháp và quy chuẩn ESLint
npm run lint

# Thử nghiệm build production
npm run build
```

---

## 6. Giấy Phép

Dự án được phân phối theo giấy phép MIT. Xem chi tiết tại [LICENSE](LICENSE) (nếu có).
