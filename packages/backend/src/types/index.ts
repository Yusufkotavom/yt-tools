import { Request } from 'express';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export interface JwtPayload {
  id: string;
  email: string;
  role: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginationQuery {
  page?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ScheduleCreateInput {
  title: string;
  description?: string;
  scheduledAt: string;
  duration?: number;
  timezone?: string;
  recurrence?: string;
  reminderTime?: number;
  thumbnailUrl?: string;
  tags?: string;
  category?: string;
  privacy?: string;
  channelId: string;
  syncToYoutube?: boolean;
}

export interface ScheduleUpdateInput {
  title?: string;
  description?: string;
  scheduledAt?: string;
  duration?: number;
  timezone?: string;
  status?: string;
  recurrence?: string;
  reminderTime?: number;
  thumbnailUrl?: string;
  tags?: string;
  category?: string;
  privacy?: string;
  syncToYoutube?: boolean;
}

export interface MetadataCreateInput {
  title: string;
  description?: string;
  tags?: string;
  categoryId?: string;
  defaultLanguage?: string;
  privacyStatus?: string;
  publishAt?: string;
  channelId: string;
}

export interface MetadataUpdateInput {
  title?: string;
  description?: string;
  tags?: string;
  categoryId?: string;
  defaultLanguage?: string;
  privacyStatus?: string;
  publishAt?: string;
}

export interface StreamKeyCreateInput {
  name: string;
  keyValue: string;
  serverUrl?: string;
  expiresAt?: string;
  bitrate?: number;
  resolution?: string;
  framerate?: number;
  codec?: string;
  channelId: string;
  youtubeLiveStreamId?: string;
  youtubeStreamName?: string;
  youtubeIngestionAddress?: string;
  autoCreateYoutubeStream?: boolean;
}

export interface StreamKeyUpdateInput {
  name?: string;
  keyValue?: string;
  serverUrl?: string;
  isActive?: boolean;
  expiresAt?: string;
  bitrate?: number;
  resolution?: string;
  framerate?: number;
  codec?: string;
  youtubeLiveStreamId?: string;
  youtubeStreamName?: string;
  youtubeIngestionAddress?: string;
  autoCreateYoutubeStream?: boolean;
}

export interface ChannelCreateInput {
  youtubeId: string;
  name: string;
  description?: string;
  thumbnailUrl?: string;
}

export interface ChannelUpdateInput {
  name?: string;
  description?: string;
  thumbnailUrl?: string;
  isActive?: boolean;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: string;
}
