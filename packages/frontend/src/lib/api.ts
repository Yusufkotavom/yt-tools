import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = '/api';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth
  async login(email: string, password: string) {
    const response = await this.client.post('/auth/login', { email, password });
    return response.data;
  }

  async register(email: string, password: string, name: string) {
    const response = await this.client.post('/auth/register', {
      email,
      password,
      name,
    });
    return response.data;
  }

  async getProfile() {
    const response = await this.client.get('/auth/profile');
    return response.data;
  }

  async updateProfile(data: { name?: string; avatar?: string }) {
    const response = await this.client.put('/auth/profile', data);
    return response.data;
  }

  // Channels
  async getChannels() {
    const response = await this.client.get('/channels');
    return response.data;
  }

  async getChannel(id: string) {
    const response = await this.client.get(`/channels/${id}`);
    return response.data;
  }

  async createChannel(data: Record<string, unknown>) {
    const response = await this.client.post('/channels', data);
    return response.data;
  }

  async updateChannel(id: string, data: Record<string, unknown>) {
    const response = await this.client.put(`/channels/${id}`, data);
    return response.data;
  }

  async deleteChannel(id: string) {
    const response = await this.client.delete(`/channels/${id}`);
    return response.data;
  }

  async getChannelStats() {
    const response = await this.client.get('/channels/stats');
    return response.data;
  }

  // Schedules
  async getSchedules(channelId?: string) {
    const params = channelId ? { channelId } : {};
    const response = await this.client.get('/schedules', { params });
    return response.data;
  }

  async getSchedule(id: string) {
    const response = await this.client.get(`/schedules/${id}`);
    return response.data;
  }

  async createSchedule(data: Record<string, unknown>) {
    const response = await this.client.post('/schedules', data);
    return response.data;
  }

  async updateSchedule(id: string, data: Record<string, unknown>) {
    const response = await this.client.put(`/schedules/${id}`, data);
    return response.data;
  }

  async deleteSchedule(id: string) {
    const response = await this.client.delete(`/schedules/${id}`);
    return response.data;
  }

  async getUpcomingSchedules(limit?: number) {
    const params = limit ? { limit } : {};
    const response = await this.client.get('/schedules/upcoming', { params });
    return response.data;
  }

  async getSchedulesByDateRange(
    startDate: string,
    endDate: string,
    channelId?: string
  ) {
    const params: Record<string, string> = { startDate, endDate };
    if (channelId) params.channelId = channelId;
    const response = await this.client.get('/schedules/range', { params });
    return response.data;
  }

  // Thumbnails
  async getThumbnails(channelId?: string) {
    const params = channelId ? { channelId } : {};
    const response = await this.client.get('/thumbnails', { params });
    return response.data;
  }

  async getThumbnail(id: string) {
    const response = await this.client.get(`/thumbnails/${id}`);
    return response.data;
  }

  async uploadThumbnail(file: File, channelId?: string, metadataId?: string) {
    const formData = new FormData();
    formData.append('file', file);
    if (channelId) formData.append('channelId', channelId);
    if (metadataId) formData.append('metadataId', metadataId);

    const response = await this.client.post('/thumbnails/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  async deleteThumbnail(id: string) {
    const response = await this.client.delete(`/thumbnails/${id}`);
    return response.data;
  }

  async setDefaultThumbnail(id: string) {
    const response = await this.client.put(`/thumbnails/${id}/default`);
    return response.data;
  }

  async getDefaultThumbnail() {
    const response = await this.client.get('/thumbnails/default');
    return response.data;
  }

  // Stream Keys
  async getStreamKeys(channelId?: string) {
    const params = channelId ? { channelId } : {};
    const response = await this.client.get('/stream-keys', { params });
    return response.data;
  }

  async getStreamKey(id: string) {
    const response = await this.client.get(`/stream-keys/${id}`);
    return response.data;
  }

  async createStreamKey(data: Record<string, unknown>) {
    const response = await this.client.post('/stream-keys', data);
    return response.data;
  }

  async updateStreamKey(id: string, data: Record<string, unknown>) {
    const response = await this.client.put(`/stream-keys/${id}`, data);
    return response.data;
  }

  async deleteStreamKey(id: string) {
    const response = await this.client.delete(`/stream-keys/${id}`);
    return response.data;
  }

  async toggleStreamKey(id: string) {
    const response = await this.client.put(`/stream-keys/${id}/toggle`);
    return response.data;
  }

  async markStreamKeyUsed(id: string) {
    const response = await this.client.put(`/stream-keys/${id}/used`);
    return response.data;
  }

  // Metadata
  async getMetadata(channelId?: string) {
    const params = channelId ? { channelId } : {};
    const response = await this.client.get('/metadata', { params });
    return response.data;
  }

  async getMetadataById(id: string) {
    const response = await this.client.get(`/metadata/${id}`);
    return response.data;
  }

  async createMetadata(data: Record<string, unknown>) {
    const response = await this.client.post('/metadata', data);
    return response.data;
  }

  async updateMetadata(id: string, data: Record<string, unknown>) {
    const response = await this.client.put(`/metadata/${id}`, data);
    return response.data;
  }

  async deleteMetadata(id: string) {
    const response = await this.client.delete(`/metadata/${id}`);
    return response.data;
  }

  // Videos
  async getVideos(channelId?: string) {
    const params = channelId ? { channelId } : {};
    const response = await this.client.get('/videos', { params });
    return response.data;
  }

  async getVideo(id: string) {
    const response = await this.client.get(`/videos/${id}`);
    return response.data;
  }

  async uploadVideo(file: File, channelId?: string, isLoop?: boolean, loopCount?: number) {
    const formData = new FormData();
    formData.append('file', file);
    if (channelId) formData.append('channelId', channelId);
    if (isLoop !== undefined) formData.append('isLoop', String(isLoop));
    if (loopCount !== undefined) formData.append('loopCount', String(loopCount));

    const response = await this.client.post('/videos/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 300000,
    });
    return response.data;
  }

  async updateVideo(id: string, data: Record<string, unknown>) {
    const response = await this.client.put(`/videos/${id}`, data);
    return response.data;
  }

  async deleteVideo(id: string) {
    const response = await this.client.delete(`/videos/${id}`);
    return response.data;
  }

  async toggleVideoLoop(id: string) {
    const response = await this.client.put(`/videos/${id}/loop`);
    return response.data;
  }

  async getLoopVideos() {
    const response = await this.client.get('/videos/loops');
    return response.data;
  }
}

export const api = new ApiService();
export default api;
