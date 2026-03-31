import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/lib/api';

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: string;
}

interface Channel {
  id: string;
  youtubeId: string;
  name: string;
  description?: string;
  thumbnailUrl?: string;
  subscriberCount: number;
  viewCount: number;
  isActive: boolean;
  youtubeConnected?: boolean;
  youtubeTokenExpiresAt?: string | null;
  _count: {
    schedules: number;
    thumbnails: number;
    streamKeys: number;
    metadata: number;
  };
}

interface Schedule {
  id: string;
  title: string;
  description?: string;
  scheduledAt: string;
  duration?: number;
  timezone: string;
  status: string;
  recurrence?: string;
  tags?: string;
  category?: string;
  privacy: string;
  channel: {
    id: string;
    name: string;
    youtubeId: string;
  };
}

interface Thumbnail {
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

interface StreamKey {
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

interface Metadata {
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

interface AppState {
  // Auth
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;

  // Data
  channels: Channel[];
  schedules: Schedule[];
  thumbnails: Thumbnail[];
  streamKeys: StreamKey[];
  metadata: Metadata[];

  // UI State
  sidebarOpen: boolean;
  darkMode: boolean;
  loading: boolean;
  error: string | null;

  // Actions
  setToken: (token: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
  toggleSidebar: () => void;
  toggleDarkMode: () => void;

  // Async Actions
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  fetchProfile: () => Promise<void>;

  fetchChannels: () => Promise<void>;
  createChannel: (data: Record<string, unknown>) => Promise<void>;
  updateChannel: (id: string, data: Record<string, unknown>) => Promise<void>;
  deleteChannel: (id: string) => Promise<void>;

  fetchSchedules: (channelId?: string) => Promise<void>;
  createSchedule: (data: Record<string, unknown>) => Promise<void>;
  updateSchedule: (id: string, data: Record<string, unknown>) => Promise<void>;
  deleteSchedule: (id: string) => Promise<void>;

  fetchThumbnails: (channelId?: string) => Promise<void>;
  uploadThumbnail: (file: File, channelId?: string) => Promise<void>;
  deleteThumbnail: (id: string) => Promise<void>;
  setDefaultThumbnail: (id: string) => Promise<void>;

  fetchStreamKeys: (channelId?: string) => Promise<void>;
  createStreamKey: (data: Record<string, unknown>) => Promise<void>;
  updateStreamKey: (id: string, data: Record<string, unknown>) => Promise<void>;
  deleteStreamKey: (id: string) => Promise<void>;
  toggleStreamKey: (id: string) => Promise<void>;

  fetchMetadata: (channelId?: string) => Promise<void>;
  createMetadata: (data: Record<string, unknown>) => Promise<void>;
  updateMetadata: (id: string, data: Record<string, unknown>) => Promise<void>;
  deleteMetadata: (id: string) => Promise<void>;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial State
      user: null,
      token: null,
      isAuthenticated: false,
      channels: [],
      schedules: [],
      thumbnails: [],
      streamKeys: [],
      metadata: [],
      sidebarOpen: true,
      darkMode: false,
      loading: false,
      error: null,

      // UI Actions
      setToken: (token) => {
        localStorage.setItem('token', token);
        set({ token, isAuthenticated: true });
      },

      setUser: (user) => set({ user }),

      logout: () => {
        localStorage.removeItem('token');
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          channels: [],
          schedules: [],
          thumbnails: [],
          streamKeys: [],
          metadata: [],
        });
      },

      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      toggleDarkMode: () => {
        const newMode = !get().darkMode;
        document.documentElement.classList.toggle('dark', newMode);
        set({ darkMode: newMode });
      },

      // Auth Actions
      login: async (email, password) => {
        set({ loading: true, error: null });
        try {
          const response = await api.login(email, password);
          const { user, token } = response.data;
          localStorage.setItem('token', token);
          set({ user, token, isAuthenticated: true, loading: false });
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Login failed';
          set({ loading: false, error: message });
          throw error;
        }
      },

      register: async (email, password, name) => {
        set({ loading: true, error: null });
        try {
          const response = await api.register(email, password, name);
          const { user, token } = response.data;
          localStorage.setItem('token', token);
          set({ user, token, isAuthenticated: true, loading: false });
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Registration failed';
          set({ loading: false, error: message });
          throw error;
        }
      },

      fetchProfile: async () => {
        try {
          const response = await api.getProfile();
          set({ user: response.data });
        } catch (error) {
          console.error('Failed to fetch profile:', error);
        }
      },

      // Channel Actions
      fetchChannels: async () => {
        try {
          const response = await api.getChannels();
          set({ channels: response.data });
        } catch (error) {
          console.error('Failed to fetch channels:', error);
        }
      },

      createChannel: async (data) => {
        try {
          const response = await api.createChannel(data);
          set((state) => ({
            channels: [response.data, ...state.channels],
          }));
        } catch (error) {
          console.error('Failed to create channel:', error);
          throw error;
        }
      },

      updateChannel: async (id, data) => {
        try {
          const response = await api.updateChannel(id, data);
          set((state) => ({
            channels: state.channels.map((c) =>
              c.id === id ? { ...c, ...response.data } : c
            ),
          }));
        } catch (error) {
          console.error('Failed to update channel:', error);
          throw error;
        }
      },

      deleteChannel: async (id) => {
        try {
          await api.deleteChannel(id);
          set((state) => ({
            channels: state.channels.filter((c) => c.id !== id),
          }));
        } catch (error) {
          console.error('Failed to delete channel:', error);
          throw error;
        }
      },

      // Schedule Actions
      fetchSchedules: async (channelId) => {
        try {
          const response = await api.getSchedules(channelId);
          set({ schedules: response.data });
        } catch (error) {
          console.error('Failed to fetch schedules:', error);
        }
      },

      createSchedule: async (data) => {
        try {
          const response = await api.createSchedule(data);
          set((state) => ({
            schedules: [response.data, ...state.schedules],
          }));
        } catch (error) {
          console.error('Failed to create schedule:', error);
          throw error;
        }
      },

      updateSchedule: async (id, data) => {
        try {
          const response = await api.updateSchedule(id, data);
          set((state) => ({
            schedules: state.schedules.map((s) =>
              s.id === id ? { ...s, ...response.data } : s
            ),
          }));
        } catch (error) {
          console.error('Failed to update schedule:', error);
          throw error;
        }
      },

      deleteSchedule: async (id) => {
        try {
          await api.deleteSchedule(id);
          set((state) => ({
            schedules: state.schedules.filter((s) => s.id !== id),
          }));
        } catch (error) {
          console.error('Failed to delete schedule:', error);
          throw error;
        }
      },

      // Thumbnail Actions
      fetchThumbnails: async (channelId) => {
        try {
          const response = await api.getThumbnails(channelId);
          set({ thumbnails: response.data });
        } catch (error) {
          console.error('Failed to fetch thumbnails:', error);
        }
      },

      uploadThumbnail: async (file, channelId) => {
        try {
          const response = await api.uploadThumbnail(file, channelId);
          set((state) => ({
            thumbnails: [response.data, ...state.thumbnails],
          }));
        } catch (error) {
          console.error('Failed to upload thumbnail:', error);
          throw error;
        }
      },

      deleteThumbnail: async (id) => {
        try {
          await api.deleteThumbnail(id);
          set((state) => ({
            thumbnails: state.thumbnails.filter((t) => t.id !== id),
          }));
        } catch (error) {
          console.error('Failed to delete thumbnail:', error);
          throw error;
        }
      },

      setDefaultThumbnail: async (id) => {
        try {
          await api.setDefaultThumbnail(id);
          set((state) => ({
            thumbnails: state.thumbnails.map((t) => ({
              ...t,
              isDefault: t.id === id,
            })),
          }));
        } catch (error) {
          console.error('Failed to set default thumbnail:', error);
          throw error;
        }
      },

      // Stream Key Actions
      fetchStreamKeys: async (channelId) => {
        try {
          const response = await api.getStreamKeys(channelId);
          set({ streamKeys: response.data });
        } catch (error) {
          console.error('Failed to fetch stream keys:', error);
        }
      },

      createStreamKey: async (data) => {
        try {
          const response = await api.createStreamKey(data);
          set((state) => ({
            streamKeys: [response.data, ...state.streamKeys],
          }));
        } catch (error) {
          console.error('Failed to create stream key:', error);
          throw error;
        }
      },

      updateStreamKey: async (id, data) => {
        try {
          const response = await api.updateStreamKey(id, data);
          set((state) => ({
            streamKeys: state.streamKeys.map((k) =>
              k.id === id ? { ...k, ...response.data } : k
            ),
          }));
        } catch (error) {
          console.error('Failed to update stream key:', error);
          throw error;
        }
      },

      deleteStreamKey: async (id) => {
        try {
          await api.deleteStreamKey(id);
          set((state) => ({
            streamKeys: state.streamKeys.filter((k) => k.id !== id),
          }));
        } catch (error) {
          console.error('Failed to delete stream key:', error);
          throw error;
        }
      },

      toggleStreamKey: async (id) => {
        try {
          const response = await api.toggleStreamKey(id);
          set((state) => ({
            streamKeys: state.streamKeys.map((k) =>
              k.id === id ? { ...k, isActive: response.data.isActive } : k
            ),
          }));
        } catch (error) {
          console.error('Failed to toggle stream key:', error);
          throw error;
        }
      },

      // Metadata Actions
      fetchMetadata: async (channelId) => {
        try {
          const response = await api.getMetadata(channelId);
          set({ metadata: response.data });
        } catch (error) {
          console.error('Failed to fetch metadata:', error);
        }
      },

      createMetadata: async (data) => {
        try {
          const response = await api.createMetadata(data);
          set((state) => ({
            metadata: [response.data, ...state.metadata],
          }));
        } catch (error) {
          console.error('Failed to create metadata:', error);
          throw error;
        }
      },

      updateMetadata: async (id, data) => {
        try {
          const response = await api.updateMetadata(id, data);
          set((state) => ({
            metadata: state.metadata.map((m) =>
              m.id === id ? { ...m, ...response.data } : m
            ),
          }));
        } catch (error) {
          console.error('Failed to update metadata:', error);
          throw error;
        }
      },

      deleteMetadata: async (id) => {
        try {
          await api.deleteMetadata(id);
          set((state) => ({
            metadata: state.metadata.filter((m) => m.id !== id),
          }));
        } catch (error) {
          console.error('Failed to delete metadata:', error);
          throw error;
        }
      },
    }),
    {
      name: 'yt-live-manager-storage',
      partialize: (state) => ({
        token: state.token,
        darkMode: state.darkMode,
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
);
