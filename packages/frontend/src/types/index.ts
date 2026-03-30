export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: string;
  createdAt?: string;
}

export interface Channel {
  id: string;
  youtubeId: string;
  name: string;
  description?: string;
  thumbnailUrl?: string;
  subscriberCount: number;
  viewCount: number;
  isActive: boolean;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: string;
  _count: {
    schedules: number;
    thumbnails: number;
    streamKeys: number;
    metadata: number;
  };
}

export interface StreamSchedule {
  id: string;
  title: string;
  description?: string;
  scheduledAt: string;
  duration?: number;
  timezone: string;
  status: string;
  recurrence?: string;
  reminderTime?: number;
  thumbnailUrl?: string;
  tags?: string;
  category?: string;
  privacy: string;
  channel: {
    id: string;
    name: string;
    youtubeId: string;
  };
}

export interface Thumbnail {
  id: string;
  filename: string;
  originalName: string;
  path: string;
  size: number;
  width?: number;
  height?: number;
  mimeType: string;
  isDefault: boolean;
  channel?: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface StreamKey {
  id: string;
  name: string;
  keyValue: string;
  serverUrl?: string;
  isActive: boolean;
  lastUsedAt?: string;
  expiresAt?: string;
  bitrate?: number;
  resolution?: string;
  framerate?: number;
  codec?: string;
  channel: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Metadata {
  id: string;
  title: string;
  description?: string;
  tags?: string;
  categoryId?: string;
  defaultLanguage?: string;
  privacyStatus: string;
  publishAt?: string;
  channel: {
    id: string;
    name: string;
    youtubeId: string;
  };
  thumbnails: {
    id: string;
    path: string;
    filename: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: StreamSchedule;
}

export interface DashboardStats {
  totalChannels: number;
  activeChannels: number;
  totalSchedules: number;
  totalThumbnails: number;
  totalStreamKeys: number;
  upcomingStreams: number;
  completedStreams: number;
}
