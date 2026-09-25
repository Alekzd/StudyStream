# StudyStream — Agent Instructions

## Project Overview
StudyStream is a pure web-based virtual study platform (NO native app installation required).
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
6. **Git Policy** — KHÔNG tự ý `git commit` hay `git push`. Mọi thay đổi giữ ở local để user tự review và commit.

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

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read
`convex/_generated/ai/guidelines.md` first** for important guidelines on
how to correctly use Convex APIs and patterns. The file contains rules that
override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running
`npx convex ai-files install`.

<!-- convex-ai-end -->
