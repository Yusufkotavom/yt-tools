# YouTube Live Manager

A comprehensive YouTube Live stream management application with a complete GUI.

## Features

- **Dashboard** - Overview of channels, schedules, thumbnails, and stream keys
- **Live Stream Scheduling** - Calendar view with drag-and-drop scheduling
- **Thumbnail Management** - Upload, preview, and manage stream thumbnails
- **Metadata Templates** - Create reusable metadata templates for streams
- **Stream Key Management** - Secure storage and management of stream keys
- **Multi-User Support** - Manage multiple YouTube channels

## Tech Stack

### Frontend
- React 18 + TypeScript
- Tailwind CSS
- Zustand (State Management)
- React Big Calendar
- Vite

### Backend
- Node.js + Express
- TypeScript
- Prisma ORM
- SQLite

## Getting Started

### Prerequisites
- Node.js 18+

### Installation

```bash
# Install dependencies
npm install

# Setup database
cd packages/backend
npm run db:push
npm run db:seed
```

### Development

```bash
# Run both frontend and backend
npm run dev

# Or run separately
npm run dev:backend   # http://localhost:3001
npm run dev:frontend  # http://localhost:5173
```

### YouTube OAuth Setup (for Dashboard Live Control)

Add these env vars for backend:

```bash
YOUTUBE_CLIENT_ID=...
YOUTUBE_CLIENT_SECRET=...
YOUTUBE_REDIRECT_URI=http://localhost:3001/api/channels/youtube/callback
FRONTEND_URL=http://localhost:5173
```

In Google Cloud Console OAuth app, whitelist redirect URI:

```text
http://localhost:3001/api/channels/youtube/callback
```

Then in app:
1. Open **Settings > Channels**
2. Click **Connect YouTube** on a channel
3. Authorize Google account
4. Start live from **Dashboard > Live Control**

### Build

```bash
npm run build
```

## Demo Account

- Email: `demo@example.com`
- Password: `demo123`

## Project Structure

```
yt-tools/
├── packages/
│   ├── backend/           # Express API server
│   │   ├── prisma/        # Database schema & seed
│   │   └── src/           # Source code
│   └── frontend/          # React application
│       └── src/           # Source code
├── package.json           # Root package.json
└── README.md
```

## License

MIT
