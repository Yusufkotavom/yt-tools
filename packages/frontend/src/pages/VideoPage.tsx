import { useEffect, useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useAppStore } from '@/store/useAppStore';
import {
  Video,
  Upload,
  Trash2,
  Repeat,
  Play,
  Search,
  Filter,
} from 'lucide-react';
import { Card, CardContent } from '@/components/Common/Card';
import Button from '@/components/Common/Button';
import Badge from '@/components/Common/Badge';
import EmptyState from '@/components/Common/EmptyState';
import Loading from '@/components/Common/Loading';
import { formatFileSize } from '@/lib/utils';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import axios from 'axios';

interface VideoItem {
  id: string;
  filename: string;
  originalName: string;
  path: string;
  size: number;
  duration?: number;
  width?: number;
  height?: number;
  mimeType: string;
  isLoop: boolean;
  loopCount: number;
  channel?: { id: string; name: string };
  createdAt: string;
}

export default function VideoPage() {
  const { channels, fetchChannels } = useAppStore();
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChannel, setSelectedChannel] = useState('');
  const [filterLoop, setFilterLoop] = useState(false);
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);

  const fetchVideos = useCallback(async () => {
    setLoading(true);
    try {
      const response = filterLoop
        ? await api.getLoopVideos()
        : await api.getVideos(selectedChannel || undefined);
      setVideos(response.data);
    } catch {
      toast.error('Failed to fetch videos');
    } finally {
      setLoading(false);
    }
  }, [selectedChannel, filterLoop]);

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      setUploading(true);
      try {
        for (const file of acceptedFiles) {
          await api.uploadVideo(file, selectedChannel || undefined, false, 0);
        }
        toast.success(`${acceptedFiles.length} video(s) uploaded`);
        fetchVideos();
      } catch (error) {
        const message = axios.isAxiosError(error)
          ? (error.response?.data?.error ?? error.message)
          : 'Failed to upload video';
        toast.error(message);
      } finally {
        setUploading(false);
      }
    },
    [selectedChannel, fetchVideos]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
  });

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this video?')) return;
    try {
      await api.deleteVideo(id);
      toast.success('Video deleted');
      fetchVideos();
    } catch {
      toast.error('Failed to delete video');
    }
  };

  const handleToggleLoop = async (id: string) => {
    try {
      await api.toggleVideoLoop(id);
      toast.success('Loop toggled');
      fetchVideos();
    } catch {
      toast.error('Failed to toggle loop');
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const filteredVideos = videos.filter((v) =>
    v.originalName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Videos & Loops
          </h1>
          <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-500 dark:text-gray-400">
            Upload videos for your live streams
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="p-4 sm:p-6">
          <div
            {...getRootProps()}
            className={`cursor-pointer rounded-lg border-2 border-dashed p-6 sm:p-8 text-center transition-colors ${
              isDragActive
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-300 hover:border-gray-400 dark:border-gray-600'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400" />
            <p className="mt-3 sm:mt-4 text-sm font-medium text-gray-700 dark:text-gray-200">
              {isDragActive ? 'Drop here...' : 'Drag & drop videos or click'}
            </p>
            <p className="mt-1 sm:mt-2 text-xs text-gray-500 dark:text-gray-400">
              MP4, WebM, OGG, MOV, AVI (max 500MB)
            </p>
            {uploading && (
              <div className="mt-4">
                <Loading size="sm" />
                <p className="mt-2 text-sm text-gray-500">Uploading...</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search videos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex h-10 w-full rounded-md border border-gray-300 bg-white pl-10 pr-3 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </div>
        <select
          value={selectedChannel}
          onChange={(e) => setSelectedChannel(e.target.value)}
          className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        >
          <option value="">All Channels</option>
          {channels.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <Button
          variant={filterLoop ? 'primary' : 'outline'}
          onClick={() => setFilterLoop(!filterLoop)}
          size="sm"
        >
          <Filter className="mr-2 h-4 w-4" />
          Loops Only
        </Button>
      </div>

      {loading ? (
        <Loading size="lg" className="py-12" />
      ) : filteredVideos.length === 0 ? (
        <EmptyState
          icon={Video}
          title="No videos yet"
          description="Upload your first video to get started."
        />
      ) : (
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {filteredVideos.map((video) => (
            <Card key={video.id} className="overflow-hidden">
              <div className="relative aspect-video bg-gray-900">
                {playingVideo === video.id ? (
                  <video
                    src={`/uploads/${video.filename}`}
                    controls
                    autoPlay
                    className="h-full w-full"
                    onEnded={() => setPlayingVideo(null)}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <button
                      onClick={() => setPlayingVideo(video.id)}
                      className="rounded-full bg-white/20 p-4 hover:bg-white/30 transition-colors"
                    >
                      <Play className="h-8 w-8 text-white" />
                    </button>
                  </div>
                )}
                {video.isLoop && (
                  <div className="absolute top-2 right-2">
                    <Badge variant="success">
                      <Repeat className="mr-1 h-3 w-3" />
                      Loop
                    </Badge>
                  </div>
                )}
                {video.duration && (
                  <div className="absolute bottom-2 right-2 bg-black/70 px-2 py-0.5 rounded text-xs text-white">
                    {formatDuration(video.duration)}
                  </div>
                )}
              </div>
              <CardContent className="p-3 sm:p-4">
                <h4 className="truncate font-medium text-gray-900 dark:text-white text-sm sm:text-base">
                  {video.originalName}
                </h4>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <span>{formatFileSize(video.size)}</span>
                  {video.width && video.height && (
                    <span>{video.width}x{video.height}</span>
                  )}
                </div>
                {video.channel && (
                  <p className="mt-1 text-xs text-gray-400">{video.channel.name}</p>
                )}
                <div className="mt-3 flex items-center gap-2">
                  <Button
                    size="sm"
                    variant={video.isLoop ? 'primary' : 'outline'}
                    onClick={() => handleToggleLoop(video.id)}
                  >
                    <Repeat className="mr-1 h-3 w-3" />
                    {video.isLoop ? 'Looping' : 'Loop'}
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleDelete(video.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
