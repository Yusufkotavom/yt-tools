import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import {
  Calendar,
  Image,
  Key,
  Tv,
  Clock,
  TrendingUp,
  Radio,
  Square,
  AlertCircle,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Common/Card';
import StatCard from '@/components/Common/StatCard';
import Badge from '@/components/Common/Badge';
import Button from '@/components/Common/Button';
import Input from '@/components/Common/Input';
import Textarea from '@/components/Common/Textarea';
import { formatDateTime, formatDuration } from '@/lib/utils';
import api from '@/lib/api';
import { StreamSchedule } from '@/types';
import toast from 'react-hot-toast';
import axios from 'axios';

interface VideoItem {
  id: string;
  filename: string;
  originalName: string;
  channel?: { id: string; name: string };
}

interface LiveSession {
  status: 'starting' | 'live' | 'stopping' | 'stopped' | 'error';
  youtubeStatus?: string;
  youtubeWatchUrl?: string;
  streamKeyName: string;
  videoName: string;
  title: string;
  description?: string;
  thumbnailFilename?: string;
  startedAt: string;
  endedAt?: string;
  lastError?: string;
  pid?: number;
  note?: string;
  recentLogs?: string[];
}

export default function DashboardPage() {
  const {
    channels,
    schedules,
    thumbnails,
    streamKeys,
    fetchChannels,
    fetchSchedules,
    fetchStreamKeys,
    fetchThumbnails,
  } = useAppStore();

  const [upcomingStreams, setUpcomingStreams] = useState<StreamSchedule[]>([]);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [liveSession, setLiveSession] = useState<LiveSession | null>(null);
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveForm, setLiveForm] = useState({
    channelId: '',
    streamKeyId: '',
    videoId: '',
    thumbnailId: '',
    privacyStatus: 'public' as 'public' | 'unlisted' | 'private',
    title: '',
    description: '',
  });

  const fetchUpcoming = useCallback(async () => {
    try {
      const response = await api.getUpcomingSchedules(5);
      setUpcomingStreams(response.data);
    } catch (error) {
      console.error('Failed to fetch upcoming streams:', error);
    }
  }, []);

  const fetchVideos = useCallback(async (channelId?: string) => {
    try {
      const response = await api.getVideos(channelId || undefined);
      setVideos(response.data);
    } catch (error) {
      console.error('Failed to fetch videos:', error);
    }
  }, []);

  const fetchLiveStatus = useCallback(async () => {
    try {
      const response = await api.getLiveStatus();
      setLiveSession(response.data);
    } catch (error) {
      console.error('Failed to fetch live status:', error);
    }
  }, []);

  useEffect(() => {
    fetchChannels();
    fetchSchedules();
    fetchUpcoming();
    fetchLiveStatus();
  }, [fetchChannels, fetchSchedules, fetchUpcoming, fetchLiveStatus]);

  useEffect(() => {
    fetchStreamKeys(liveForm.channelId || undefined);
    fetchThumbnails(liveForm.channelId || undefined);
    fetchVideos(liveForm.channelId || undefined);
  }, [fetchStreamKeys, fetchThumbnails, fetchVideos, liveForm.channelId]);

  useEffect(() => {
    const interval = setInterval(fetchLiveStatus, 5000);
    return () => clearInterval(interval);
  }, [fetchLiveStatus]);

  const availableStreamKeys = useMemo(
    () =>
      streamKeys.filter(
        (key) => key.isActive && (!liveForm.channelId || key.channel.id === liveForm.channelId)
      ),
    [streamKeys, liveForm.channelId]
  );

  const availableThumbnails = useMemo(
    () =>
      thumbnails.filter(
        (thumbnail) =>
          !liveForm.channelId || thumbnail.channel?.id === liveForm.channelId
      ),
    [thumbnails, liveForm.channelId]
  );

  useEffect(() => {
    if (!liveForm.streamKeyId && availableStreamKeys.length > 0) {
      setLiveForm((prev) => ({ ...prev, streamKeyId: availableStreamKeys[0].id }));
    }
  }, [availableStreamKeys, liveForm.streamKeyId]);

  useEffect(() => {
    if (!liveForm.videoId && videos.length > 0) {
      setLiveForm((prev) => ({ ...prev, videoId: videos[0].id }));
    }
  }, [videos, liveForm.videoId]);

  useEffect(() => {
    if (!liveForm.thumbnailId && availableThumbnails.length > 0) {
      setLiveForm((prev) => ({ ...prev, thumbnailId: availableThumbnails[0].id }));
    }
  }, [availableThumbnails, liveForm.thumbnailId]);

  const startLive = async () => {
    if (!liveForm.channelId || !liveForm.streamKeyId || !liveForm.videoId || !liveForm.title.trim()) {
      toast.error('Channel, stream key, video, and title are required');
      return;
    }

    setLiveLoading(true);
    try {
      const response = await api.startLive({
        streamKeyId: liveForm.streamKeyId,
        videoId: liveForm.videoId,
        channelId: liveForm.channelId,
        title: liveForm.title.trim(),
        description: liveForm.description.trim() || undefined,
        thumbnailId: liveForm.thumbnailId || undefined,
        privacyStatus: liveForm.privacyStatus,
      });
      setLiveSession(response.data);
      toast.success('Live stream started');
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? (error.response?.data?.error ?? error.message)
        : error instanceof Error
        ? error.message
        : 'Failed to start live stream';
      toast.error(message);
    } finally {
      setLiveLoading(false);
    }
  };

  const stopLive = async () => {
    setLiveLoading(true);
    try {
      const response = await api.stopLive();
      setLiveSession(response.data);
      toast.success('Stopping live stream');
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? (error.response?.data?.error ?? error.message)
        : error instanceof Error
        ? error.message
        : 'Failed to stop live stream';
      toast.error(message);
    } finally {
      setLiveLoading(false);
    }
  };

  const stats = {
    totalChannels: channels.length,
    activeChannels: channels.filter((c) => c.isActive).length,
    totalSchedules: schedules.length,
    upcomingStreams: upcomingStreams.length,
    totalThumbnails: thumbnails.length,
    totalStreamKeys: streamKeys.length,
  };

  const liveStatusVariant =
    liveSession?.status === 'live'
      ? 'success'
      : liveSession?.status === 'starting' || liveSession?.status === 'stopping'
      ? 'warning'
      : liveSession?.status === 'error'
      ? 'danger'
      : 'secondary';

  const isLiveActive =
    liveSession?.status === 'live' || liveSession?.status === 'starting' || liveSession?.status === 'stopping';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Dashboard
        </h1>
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          Welcome back! Here&apos;s an overview of your YouTube Live management.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Channels"
          value={stats.totalChannels}
          description={`${stats.activeChannels} active`}
          icon={Tv}
          color="blue"
        />
        <StatCard
          title="Schedules"
          value={stats.totalSchedules}
          description={`${stats.upcomingStreams} upcoming`}
          icon={Calendar}
          color="green"
        />
        <StatCard
          title="Thumbnails"
          value={stats.totalThumbnails}
          description="Templates ready"
          icon={Image}
          color="purple"
        />
        <StatCard
          title="Stream Keys"
          value={stats.totalStreamKeys}
          description="Configured"
          icon={Key}
          color="yellow"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Upcoming Streams
            </CardTitle>
            <Link
              to="/schedules"
              className="text-sm text-primary-600 hover:text-primary-500"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {upcomingStreams.length === 0 ? (
              <div className="py-8 text-center">
                <Calendar className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" />
                <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                  No upcoming streams scheduled.
                </p>
                <Link
                  to="/schedules"
                  className="mt-4 inline-block text-sm text-primary-600 hover:text-primary-500"
                >
                  Schedule a stream
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingStreams.map((stream) => (
                  <div
                    key={stream.id}
                    className="flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-gray-700"
                  >
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {stream.title}
                      </h4>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {formatDateTime(stream.scheduledAt)}
                        {stream.duration && ` • ${formatDuration(stream.duration)}`}
                      </p>
                      <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                        {stream.channel.name}
                      </p>
                    </div>
                    <Badge
                      variant={
                        stream.status === 'live'
                          ? 'success'
                          : stream.status === 'scheduled'
                          ? 'default'
                          : 'secondary'
                      }
                    >
                      {stream.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              <Link
                to="/schedules"
                className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700"
              >
                <div className="rounded-lg bg-green-100 p-2 dark:bg-green-900/30">
                  <Calendar className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    Schedule Stream
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Plan your next live
                  </p>
                </div>
              </Link>

              <Link
                to="/thumbnails"
                className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700"
              >
                <div className="rounded-lg bg-purple-100 p-2 dark:bg-purple-900/30">
                  <Image className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    Upload Thumbnail
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Manage visuals
                  </p>
                </div>
              </Link>

              <Link
                to="/metadata"
                className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700"
              >
                <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900/30">
                  <Tv className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    Edit Metadata
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Update descriptions
                  </p>
                </div>
              </Link>

              <Link
                to="/stream-keys"
                className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700"
              >
                <div className="rounded-lg bg-yellow-100 p-2 dark:bg-yellow-900/30">
                  <Key className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    Manage Keys
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Stream configuration
                  </p>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <Radio className="h-5 w-5" />
            Live Control
          </CardTitle>
          <Badge variant={liveStatusVariant}>{liveSession?.status || 'idle'}</Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Channel
              </label>
              <select
                value={liveForm.channelId}
                onChange={(e) =>
                  setLiveForm((prev) => ({
                    ...prev,
                    channelId: e.target.value,
                    streamKeyId: '',
                    videoId: '',
                    thumbnailId: '',
                  }))
                }
                className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Select channel</option>
                {channels.map((channel) => (
                  <option key={channel.id} value={channel.id}>
                    {channel.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Stream Key
              </label>
              <select
                value={liveForm.streamKeyId}
                onChange={(e) =>
                  setLiveForm((prev) => ({ ...prev, streamKeyId: e.target.value }))
                }
                className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Select stream key</option>
                {availableStreamKeys.map((key) => (
                  <option key={key.id} value={key.id}>
                    {key.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Video Source
              </label>
              <select
                value={liveForm.videoId}
                onChange={(e) => setLiveForm((prev) => ({ ...prev, videoId: e.target.value }))}
                className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Select video</option>
                {videos.map((video) => (
                  <option key={video.id} value={video.id}>
                    {video.originalName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Thumbnail (optional)
              </label>
              <select
                value={liveForm.thumbnailId}
                onChange={(e) =>
                  setLiveForm((prev) => ({ ...prev, thumbnailId: e.target.value }))
                }
                className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="">No thumbnail</option>
                {availableThumbnails.map((thumb) => (
                  <option key={thumb.id} value={thumb.id}>
                    {thumb.originalName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Privacy
              </label>
              <select
                value={liveForm.privacyStatus}
                onChange={(e) =>
                  setLiveForm((prev) => ({
                    ...prev,
                    privacyStatus: e.target.value as 'public' | 'unlisted' | 'private',
                  }))
                }
                className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="public">Public</option>
                <option value="unlisted">Unlisted</option>
                <option value="private">Private</option>
              </select>
            </div>
          </div>

          <Input
            label="Live Title"
            value={liveForm.title}
            onChange={(e) => setLiveForm((prev) => ({ ...prev, title: e.target.value }))}
            placeholder="Masukkan judul live"
          />

          <Textarea
            label="Description"
            value={liveForm.description}
            onChange={(e) =>
              setLiveForm((prev) => ({ ...prev, description: e.target.value }))
            }
            placeholder="Deskripsi live"
            rows={4}
          />

          {liveSession?.note && (
            <div className="flex items-start gap-2 rounded-md border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-800 dark:border-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-200">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{liveSession.note}</p>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={startLive}
              disabled={isLiveActive}
              loading={liveLoading && !isLiveActive}
            >
              <Radio className="mr-2 h-4 w-4" />
              Start Live
            </Button>
            <Button
              variant="danger"
              onClick={stopLive}
              disabled={!isLiveActive}
              loading={liveLoading && isLiveActive}
            >
              <Square className="mr-2 h-4 w-4" />
              Stop Live
            </Button>
            {liveSession?.streamKeyName && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Key: {liveSession.streamKeyName} • Video: {liveSession.videoName}
              </span>
            )}
            {liveSession?.youtubeStatus && (
              <Badge variant="outline">YouTube: {liveSession.youtubeStatus}</Badge>
            )}
            {liveSession?.youtubeWatchUrl && (
              <a
                href={liveSession.youtubeWatchUrl}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-primary-600 hover:text-primary-500"
              >
                Open YouTube Watch Page
              </a>
            )}
          </div>

          {liveSession?.recentLogs && liveSession.recentLogs.length > 0 && (
            <div className="rounded-md bg-gray-900 p-3">
              <p className="mb-2 text-xs uppercase tracking-wide text-gray-400">ffmpeg log</p>
              <pre className="max-h-48 overflow-auto whitespace-pre-wrap text-xs text-gray-200">
                {liveSession.recentLogs.slice(-8).join('\n')}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      {channels.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Channels</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {channels.slice(0, 6).map((channel) => (
                <div
                  key={channel.id}
                  className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 dark:border-gray-700"
                >
                  {channel.thumbnailUrl ? (
                    <img
                      src={channel.thumbnailUrl}
                      alt={channel.name}
                      className="h-12 w-12 rounded-full"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
                      <Tv className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="truncate font-medium text-gray-900 dark:text-white">
                      {channel.name}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {channel.subscriberCount.toLocaleString()} subscribers
                    </p>
                  </div>
                  <Badge variant={channel.isActive ? 'success' : 'secondary'}>
                    {channel.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
