import { useCallback, useEffect, useState } from 'react';
import { Radio, Square, AlertCircle, Settings2, Zap } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Common/Card';
import Badge from '@/components/Common/Badge';
import Button from '@/components/Common/Button';
import Input from '@/components/Common/Input';
import Textarea from '@/components/Common/Textarea';
import { formatDateTime } from '@/lib/utils';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import axios from 'axios';

interface VideoItem {
  id: string;
  filename: string;
  originalName: string;
  isLoop: boolean;
  channel?: { id: string; name: string };
}

interface SimpleLiveSession {
  id: string;
  status: 'starting' | 'live' | 'stopping' | 'stopped' | 'error';
  videoName: string;
  title: string;
  rtmpUrlMasked: string;
  startedAt: string;
  endedAt?: string;
  lastError?: string;
  pid?: number;
  loop: boolean;
  loopCount: number;
  videoBitrate: string;
  audioBitrate: string;
  resolution: string;
  framerate: string;
  recentLogs?: string[];
}

export default function SimpleLivePage() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [sessions, setSessions] = useState<SimpleLiveSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [form, setForm] = useState({
    rtmpUrl: '',
    streamKey: '',
    serverUrl: 'rtmp://a.rtmp.youtube.com/live2',
    videoId: '',
    title: '',
    description: '',
    loop: false,
    loopCount: 0,
    videoBitrate: '4500',
    audioBitrate: '128',
    resolution: '1920x1080',
    framerate: '30',
  });

  const fetchVideos = useCallback(async () => {
    try {
      const response = await api.getVideos();
      setVideos(response.data);
    } catch (error) {
      console.error('Failed to fetch videos:', error);
    }
  }, []);

  const fetchStatus = useCallback(async () => {
    try {
      const response = await api.getSimpleLiveStatus();
      setSessions(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to fetch simple live status:', error);
    }
  }, []);

  useEffect(() => {
    fetchVideos();
    fetchStatus();
  }, [fetchVideos, fetchStatus]);

  useEffect(() => {
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  useEffect(() => {
    if (!form.videoId && videos.length > 0) {
      setForm((prev) => ({ ...prev, videoId: videos[0].id }));
    }
  }, [videos, form.videoId]);

  const startLive = async () => {
    if (!form.videoId || !form.title.trim()) {
      toast.error('Video and title are required');
      return;
    }

    if (!form.rtmpUrl.trim() && !form.streamKey.trim()) {
      toast.error('RTMP URL or stream key is required');
      return;
    }

    setLoading(true);
    try {
      const payload: Record<string, unknown> = {
        videoId: form.videoId,
        title: form.title.trim(),
        loop: form.loop,
        videoBitrate: `${form.videoBitrate}k`,
        audioBitrate: `${form.audioBitrate}k`,
        resolution: form.resolution,
        framerate: form.framerate,
      };

      if (form.rtmpUrl.trim()) {
        payload.rtmpUrl = form.rtmpUrl.trim();
      } else {
        payload.streamKey = form.streamKey.trim();
        payload.serverUrl = form.serverUrl.trim();
      }

      if (form.loopCount > 0) {
        payload.loopCount = form.loopCount;
      }

      const response = await api.startSimpleLive(payload);
      setSessions((prev) => [response.data, ...prev.filter((s) => s.id !== response.data.id)]);
      toast.success('Live stream started');
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? (error.response?.data?.error ?? error.message)
        : error instanceof Error
          ? error.message
          : 'Failed to start live stream';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const stopLive = async (sessionId: string) => {
    setLoading(true);
    try {
      const response = await api.stopSimpleLive(sessionId);
      setSessions((prev) => prev.map((s) => (s.id === sessionId ? response.data : s)));
      toast.success('Stopping live stream');
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? (error.response?.data?.error ?? error.message)
        : error instanceof Error
          ? error.message
          : 'Failed to stop live stream';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const stopAllLive = async () => {
    setLoading(true);
    try {
      const response = await api.stopAllSimpleLive();
      if (Array.isArray(response.data)) {
        const byId = new Map<string, SimpleLiveSession>(
          response.data.map((s: SimpleLiveSession): [string, SimpleLiveSession] => [s.id, s])
        );
        setSessions((prev) => prev.map((s) => byId.get(s.id) || s));
      }
      toast.success('Stopping all live streams');
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? (error.response?.data?.error ?? error.message)
        : error instanceof Error
          ? error.message
          : 'Failed to stop all live streams';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const activeSessions = sessions.filter(
    (s) => s.status === 'live' || s.status === 'starting' || s.status === 'stopping'
  );
  const latestSession = sessions[0] || null;

  const liveStatusVariant =
    sessions.some((s) => s.status === 'live')
      ? 'success'
      : sessions.some((s) => s.status === 'starting' || s.status === 'stopping')
        ? 'warning'
        : sessions.some((s) => s.status === 'error')
          ? 'danger'
          : 'secondary';

  const resolutionOptions = [
    { value: '1920x1080', label: '1080p' },
    { value: '1280x720', label: '720p' },
    { value: '854x480', label: '480p' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
            <Zap className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Simple Live
            </h1>
            <p className="mt-1 text-gray-500 dark:text-gray-400">
              Stream langsung dengan stream key saja. Tidak perlu koneksi YouTube.
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <Radio className="h-5 w-5" />
            Live Control
          </CardTitle>
          <Badge variant={liveStatusVariant}>
            {activeSessions.length > 0 ? `${activeSessions.length} active` : 'idle'}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Masukkan <strong>RTMP URL</strong> lengkap atau gunakan <strong>Stream Key</strong> + Server URL untuk mulai streaming. Tidak perlu channel atau koneksi YouTube.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
                RTMP URL (lengkap)
              </label>
              <input
                type="text"
                value={form.rtmpUrl}
                onChange={(e) => setForm((prev) => ({ ...prev, rtmpUrl: e.target.value }))}
                placeholder="rtmp://a.rtmp.youtube.com/live2/xxxx-xxxx-xxxx"
                className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 font-mono text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
              <p className="mt-1 text-xs text-gray-400">
                Atau isi Stream Key + Server URL di bawah
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Server URL
              </label>
              <input
                type="text"
                value={form.serverUrl}
                onChange={(e) => setForm((prev) => ({ ...prev, serverUrl: e.target.value }))}
                placeholder="rtmp://a.rtmp.youtube.com/live2"
                className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 font-mono text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Stream Key
              </label>
              <input
                type="text"
                value={form.streamKey}
                onChange={(e) => setForm((prev) => ({ ...prev, streamKey: e.target.value }))}
                placeholder="xxxx-xxxx-xxxx-xxxx-xxxx"
                className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 font-mono text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Video Source
              </label>
              <select
                value={form.videoId}
                onChange={(e) => setForm((prev) => ({ ...prev, videoId: e.target.value }))}
                className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Select video</option>
                {videos.map((video) => (
                  <option key={video.id} value={video.id}>
                    {video.originalName} {video.isLoop ? '(loop)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Input
            label="Live Title"
            value={form.title}
            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            placeholder="Judul live stream"
          />

          <Textarea
            label="Description (opsional)"
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="Deskripsi live"
            rows={2}
          />

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <Settings2 className="h-4 w-4" />
              {showAdvanced ? 'Sembunyikan' : 'Tampilkan'} pengaturan lanjutan
            </button>
          </div>

          {showAdvanced && (
            <div className="grid gap-4 rounded-lg border border-gray-200 p-4 dark:border-gray-700 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Resolusi
                </label>
                <select
                  value={form.resolution}
                  onChange={(e) => setForm((prev) => ({ ...prev, resolution: e.target.value }))}
                  className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  {resolutionOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Framerate
                </label>
                <select
                  value={form.framerate}
                  onChange={(e) => setForm((prev) => ({ ...prev, framerate: e.target.value }))}
                  className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  <option value="24">24 FPS</option>
                  <option value="30">30 FPS</option>
                  <option value="60">60 FPS</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Video Bitrate (kbps)
                </label>
                <input
                  type="number"
                  value={form.videoBitrate}
                  onChange={(e) => setForm((prev) => ({ ...prev, videoBitrate: e.target.value }))}
                  className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Audio Bitrate (kbps)
                </label>
                <input
                  type="number"
                  value={form.audioBitrate}
                  onChange={(e) => setForm((prev) => ({ ...prev, audioBitrate: e.target.value }))}
                  className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="loop"
                  checked={form.loop}
                  onChange={(e) => setForm((prev) => ({ ...prev, loop: e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <label htmlFor="loop" className="text-sm text-gray-700 dark:text-gray-200">
                  Loop video
                </label>
              </div>

              {form.loop && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
                    Loop Count (0 = infinite)
                  </label>
                  <input
                    type="number"
                    value={form.loopCount}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, loopCount: parseInt(e.target.value) || 0 }))
                    }
                    className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              )}
            </div>
          )}

          {latestSession?.recentLogs && latestSession.recentLogs.length > 0 && (
            <div className="rounded-md bg-gray-900 p-3">
              <p className="mb-2 text-xs uppercase tracking-wide text-gray-400">ffmpeg log</p>
              <pre className="max-h-48 overflow-auto whitespace-pre-wrap text-xs text-gray-200">
                {latestSession.recentLogs.slice(-8).join('\n')}
              </pre>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={startLive} loading={loading}>
              <Radio className="mr-2 h-4 w-4" />
              Start Live
            </Button>
            <Button
              variant="danger"
              onClick={stopAllLive}
              disabled={activeSessions.length === 0}
              loading={loading && activeSessions.length > 0}
            >
              <Square className="mr-2 h-4 w-4" />
              Stop All
            </Button>
            {latestSession && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {latestSession.rtmpUrlMasked} &bull; {latestSession.videoName}
              </span>
            )}
          </div>

          {sessions.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Live Sessions
              </p>
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="flex flex-wrap items-center gap-2 rounded-md border border-gray-200 p-3 dark:border-gray-700"
                >
                  <Badge
                    variant={
                      session.status === 'live'
                        ? 'success'
                        : session.status === 'error'
                          ? 'danger'
                          : session.status === 'stopped'
                            ? 'secondary'
                            : 'warning'
                    }
                  >
                    {session.status}
                  </Badge>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    {session.title}
                  </span>
                  <span className="text-xs text-gray-400">
                    {session.rtmpUrlMasked}
                  </span>
                  <div className="ml-auto flex items-center gap-2">
                    <span className="text-xs text-gray-400">
                      {session.resolution} &bull; {session.framerate}fps &bull; {session.videoBitrate}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDateTime(session.startedAt)}
                    </span>
                    {(session.status === 'live' || session.status === 'starting') && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => stopLive(session.id)}
                        loading={loading}
                      >
                        <Square className="mr-1 h-3 w-3" />
                        Stop
                      </Button>
                    )}
                  </div>
                  {session.status === 'error' && session.lastError && (
                    <div className="flex w-full items-start gap-1 text-xs text-red-500">
                      <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
                      {session.lastError}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
