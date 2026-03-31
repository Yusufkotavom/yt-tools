# YouTube Live Manager

A web app to manage YouTube Live operations from one dashboard:
- connect channel OAuth
- manage stream keys and video assets
- run multiple live sessions
- sync schedule data to YouTube broadcasts

## Current Implementation

- **Dashboard Live Control**
  - start/stop live sessions
  - stop all active sessions
  - monitor per-session status and logs
- **YouTube OAuth per Channel**
  - connect/disconnect channel account
- **Stream Key Management**
  - create/update/toggle keys
  - resolve/create mapping to YouTube liveStream
- **Schedule Management**
  - internal schedule CRUD
  - sync status to YouTube (`synced`, `pending`, `sync_error`)
- **Media Management**
  - video + thumbnail upload and reuse

## Tech Stack

- Frontend: React 18, TypeScript, Vite, Tailwind, Zustand
- Backend: Node.js, Express, TypeScript
- Data: Prisma + SQLite
- Integrations: YouTube Data API

## Setup

### 1) Prerequisites

- Node.js 18+
- Google Cloud OAuth credentials (for YouTube integration)

### 2) Install

```bash
npm install
```

### 3) Configure environment

Set backend environment variables:

```bash
YOUTUBE_CLIENT_ID=...
YOUTUBE_CLIENT_SECRET=...
YOUTUBE_REDIRECT_URI=http://localhost:3001/api/channels/youtube/callback
FRONTEND_URL=http://localhost:5173
MAX_CONCURRENT_LIVE=4
FFMPEG_PATH=ffmpeg
```

Google OAuth redirect URI must include:

```text
http://localhost:3001/api/channels/youtube/callback
```

### 4) Database init

```bash
npm run db:push --workspace=packages/backend
npm run db:seed --workspace=packages/backend
```

### 5) Run in development

```bash
npm run dev
```

- Backend: `http://localhost:3001`
- Frontend: `http://localhost:5173`

## Operational Flow

1. Open **Settings > Channels**
2. Add channel and click **Connect YouTube**
3. Open **Stream Keys**
4. Add stream key or click resolve/create mapping
5. Upload video and thumbnail assets
6. Open **Dashboard > Live Control**
7. Start live (single or multiple sessions)
8. Monitor status and stop per session or stop all

## Notes and Limits

- Concurrent live sessions are limited by `MAX_CONCURRENT_LIVE`.
- One stream key cannot be used by two active sessions at the same time.
- If schedule sync fails, internal schedule is still saved with `sync_error`.
- FFmpeg must be available in server runtime.

## Development Roadmap (Next)

- **Priority A: Reliability**
  - stronger process recovery after backend restart
  - automatic retry queue for YouTube sync failures
  - structured observability (session metrics + alerting)
- **Priority B: Scheduling Automation**
  - start live directly from schedule UI with prebound stream/video profile
  - retry + reconciliation worker for missed updates
- **Priority C: Operator Productivity**
  - profile presets (video+thumbnail+key+privacy)
  - bulk schedule operations and batch sync
  - audit timeline per channel/session
- **Priority D: Multi-user Governance**
  - role-based permissions per channel
  - approval workflow for schedule publish/live start

## Useful Commands

```bash
# backend typecheck
npm run typecheck --workspace=packages/backend

# frontend typecheck
npm run typecheck --workspace=packages/frontend

# regenerate prisma client
npm run db:generate --workspace=packages/backend
```

## Demo Account

- Email: `demo@example.com`
- Password: `demo123`
