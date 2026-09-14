# StudyStream OS — Agent Instructions
# Reference: All vault notes in C:\Vault\Đời Anh Chó Lắm\StudyStream\

## Project Overview
StudyStream OS is a pure web-based virtual study platform (NO native app installation required).
CSW.live-inspired body doubling + Discord-style multi-server rooms.

## Tech Stack
- **Next.js 15** (App Router, RSC where possible)
- **TypeScript 5** (strict mode, no `any`)
- **Tailwind CSS v4** (OKLCH color space, dark/OLED mode)
- **Convex** v1.24+ (reactive WebSocket DB — the source of truth)
- **Clerk** (authentication + webhooks via Svix)
- **LiveKit** (WebRTC SFU for camera/mic streams)
- **Howler.js** (ambient soundscape mixer)

## Directory Structure
```
studystream/
├── app/
│   ├── (auth)/sign-in/      # Clerk hosted sign-in
│   ├── (auth)/sign-up/      # Clerk hosted sign-up
│   ├── (main)/              # Authenticated app shell
│   │   ├── servers/[serverId]/          # Server layout (sidebar + rooms)
│   │   │   └── rooms/[roomId]/         # Room view (video grid + chat)
│   │   ├── explore/                    # Discover public servers
│   │   └── profile/                    # User focus stats & heatmap
│   └── layout.tsx           # Root providers (Clerk + Convex)
├── components/
│   ├── ui/                  # Primitive UI (Button, Dialog, etc.)
│   ├── server/              # ServerSidebar, CreateServerModal
│   ├── room/                # StudyVideoGrid, RoomSidebar, ChatDrawer
│   ├── pomodoro/            # PomodoroTimer, PomodoroControls
│   └── soundscape/          # SoundscapeMixer
├── hooks/                   # useSynchronizedPomodoro, useTrackVisibility
├── lib/                     # utils, constants, soundscapeManager
└── convex/                  # Serverless backend (schema, mutations, actions)
```

## Key Design Rules
1. **No heartbeat pings to Convex** — Join/Leave events only. Never poll DB for presence.
2. **Server-authoritative Pomodoro** — Store `targetEndTime`, clients compute remaining.
3. **Archetype-based permissions** — SILENT_FOCUS rooms block microphone at LiveKit token level.
4. **Adaptive Simulcast** — LiveKit auto-degrades to 180p thumbnails in grid view.
5. **isSandbox flag** — Sandbox rooms don't count toward streak/focus logs.

## Environment Variables Required
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_WEBHOOK_SIGNING_SECRET=
CLERK_JWT_ISSUER_DOMAIN=
NEXT_PUBLIC_CONVEX_URL=
CONVEX_DEPLOYMENT=
LIVEKIT_API_KEY=
LIVEKIT_API_SECRET=
NEXT_PUBLIC_LIVEKIT_WS_URL=
```
