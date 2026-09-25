# StudyStream

> A pure web-based virtual study and body doubling platform built with Next.js 15, Convex, and LiveKit WebRTC.

[![CI](https://github.com/Alekzd/StudyStream/actions/workflows/ci.yml/badge.svg)](https://github.com/Alekzd/StudyStream/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js&logoColor=white)](https://nextjs.org/)
[![Convex](https://img.shields.io/badge/Convex-1.24+-F04D21?logo=convex&logoColor=white)](https://convex.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 1. Overview

**StudyStream** is a distraction-free, browser-native virtual study and co-working space designed for students, developers, and remote workers. Inspired by body doubling psychology, it allows users to study together on camera, stay accountable with synchronized Pomodoro timers, and immerse themselves in customizable ambient audio soundscapes — without needing any native app installations.

---

## 2. Key Features

- **Live WebRTC Study Rooms:** Low-latency video grid with adaptive simulcast that automatically degrades off-screen or thumbnail streams to 180p to conserve client bandwidth.
- **Server-Authoritative Pomodoro:** Drift-free timer synchronized via Convex WebSockets (`targetEndTime`). Clients compute elapsed intervals locally, and the system handles automatic transitions between focus and rest phases with audio notifications.
- **Ambient Soundscape Mixer:** Built-in multi-track audio engine powered by Howler.js. Mix and match rain, café chatter, fireplace, soft jazz, and wind sounds with independent volume controls.
- **Servers & Categorized Channels:** Discord-inspired community architecture allowing users to organize rooms by focus mode:
  - `SILENT_FOCUS`: Strict silence mode where microphone publish permissions are revoked at the server token level.
  - `POMODORO_SYNCED`: Rooms that strictly follow room-wide work/break intervals.
  - `CASUAL_LOUNGE`: Open voice and camera spaces for collaborative study sessions.
- **Focus Analytics & Streaks:** Tracks user study sessions, daily streaks, and cumulative focus hours with privacy-first sandboxed room exclusions.
- **Security & Access Control:** Full authentication integration via Clerk, Svix HMAC signature validation for webhooks, server-side LiveKit JWT token issuance with 4-hour expiration, and internal-only database mutations to eliminate client privilege escalation.

---

## 3. Technology Stack

| Layer | Technology | Description |
|---|---|---|
| **Framework** | [Next.js 15](https://nextjs.org/) | App Router, React 19, Server Components, Turbopack |
| **Backend & DB** | [Convex 1.24+](https://convex.dev/) | Reactive WebSocket database, serverless mutations & crons |
| **Authentication** | [Clerk](https://clerk.com/) | Secure auth with JWT session tokens and Svix webhook verification |
| **Real-time Video** | [LiveKit](https://livekit.io/) | WebRTC SFU for multi-party camera and audio streaming |
| **Audio Engine** | [Howler.js](https://howlerjs.com/) | High-performance spatial ambient sound mixer |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) | Modern color space (OKLCH), OLED dark aesthetic |
| **Testing & Quality** | [Vitest](https://vitest.dev/) / ESLint | Unit & integration tests, strict TypeScript 5 |

---

## 4. Project Directory Structure

```text
studystream/
├── .github/
│   └── workflows/ci.yml       # GitHub Actions CI pipeline
├── app/
│   ├── (auth)/                # Clerk hosted sign-in & sign-up routes
│   ├── (main)/                # Authenticated application shell
│   │   ├── servers/[serverId] # Server layout and channel navigation
│   │   │   └── rooms/[roomId] # Virtual room viewport (video grid + pomodoro + chat)
│   │   ├── explore/           # Discover public study servers and rooms
│   │   └── profile/           # User study statistics, streaks, and heatmap
│   ├── layout.tsx             # Root layout with Clerk, Convex, and Language providers
│   └── page.tsx               # Minimalist landing page
├── components/
│   ├── layout/                # UnifiedSidebar, MobileBottomNav, MobileHeader
│   ├── pomodoro/              # PomodoroTimer, PomodoroControls
│   ├── room/                  # StudyVideoGrid, RoomView, ChatDrawer, DiagnosticHUD
│   ├── server/                # ChannelSidebar, CreateRoomModal, ServerCard
│   ├── soundscape/            # SoundscapeMixer, AmbientAudioDock, SidebarAudioWidget
│   └── ui/                    # Base primitives, motion transitions, semantic icons
├── context/                   # ActiveRoomContext, LanguageContext
├── convex/                    # Reactive backend schema, queries, mutations, actions, crons
├── hooks/                     # useSynchronizedPomodoro, useTrackVisibility
├── lib/                       # Soundscape manager, mock streams, utility functions
└── tests/                     # Vitest test suites (Pomodoro, Presence, Icons, Helpers)
```

---

## 5. Getting Started

### Prerequisites

- **Node.js**: `v20.x` or later (LTS recommended)
- **npm**: `v10.x` or later
- **Convex Account**: [https://convex.dev](https://convex.dev)
- **Clerk Account**: [https://clerk.com](https://clerk.com)
- **LiveKit Cloud / Server**: [https://livekit.io](https://livekit.io)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Alekzd/StudyStream.git
   cd StudyStream
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```
   Fill in your service credentials in `.env.local`:

   ```env
   # Clerk Authentication
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   CLERK_WEBHOOK_SIGNING_SECRET=whsec_...
   CLERK_JWT_ISSUER_DOMAIN=https://your-instance.clerk.accounts.dev

   # Convex Backend
   NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
   NEXT_PUBLIC_CONVEX_SITE_URL=https://your-deployment.convex.site
   CONVEX_DEPLOYMENT=dev:your-deployment

   # LiveKit WebRTC SFU
   LIVEKIT_API_KEY=APIxxxxxxxxxx
   LIVEKIT_API_SECRET=your_secret_key
   NEXT_PUBLIC_LIVEKIT_WS_URL=wss://your-project.livekit.cloud

   # Application Base URL
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Initialize Convex Backend:**
   In your first terminal, run:
   ```bash
   npx convex dev
   ```

5. **Start Next.js Development Server:**
   In a second terminal, run:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 6. Testing & Code Quality

StudyStream enforces strict typing and unit test coverage across timer synchronization, semantic icons, and session presence:

```bash
# Run Vitest unit test suite (61 tests)
npm run test:run

# Run TypeScript strict type verification
npm run typecheck

# Run ESLint code style audit
npm run lint

# Compile production build
npm run build
```

---

## 7. CI/CD Pipeline

Every push and pull request to `main` triggers the automated GitHub Actions pipeline (`.github/workflows/ci.yml`):
- **Security & Secrets Hygiene:** Scans for leaked `.env` files and runs `npm audit --audit-level=high`.
- **TypeScript & ESLint Check:** Validates zero TypeScript errors and code style standards.
- **Automated Tests:** Executes the complete Vitest test suite.
- **Production Build:** Builds the Next.js 15 application with Turbopack.

---

## 8. License

This project is open-source software licensed under the [MIT License](LICENSE).
