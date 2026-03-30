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
