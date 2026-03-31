import { useEffect, useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useAppStore } from '@/store/useAppStore';
import {
  Image,
  Upload,
  Trash2,
  Star,
  StarOff,
  Search,
} from 'lucide-react';
import { Card, CardContent } from '@/components/Common/Card';
import Button from '@/components/Common/Button';
import Badge from '@/components/Common/Badge';
import EmptyState from '@/components/Common/EmptyState';
import Loading from '@/components/Common/Loading';
import { formatFileSize, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import axios from 'axios';

export default function ThumbnailPage() {
  const {
    thumbnails,
    channels,
    fetchThumbnails,
    fetchChannels,
    uploadThumbnail,
    deleteThumbnail,
    setDefaultThumbnail,
  } = useAppStore();

  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<string>('');

  useEffect(() => {
    fetchChannels();
    fetchThumbnails();
  }, [fetchChannels, fetchThumbnails]);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      setLoading(true);
      try {
        for (const file of acceptedFiles) {
          await uploadThumbnail(file, selectedChannel || undefined);
        }
        toast.success(`${acceptedFiles.length} thumbnail(s) uploaded successfully`);
        fetchThumbnails();
      } catch (error) {
        const message = axios.isAxiosError(error)
          ? (error.response?.data?.error ?? error.message)
          : 'Failed to upload thumbnail';
        toast.error(message);
      } finally {
        setLoading(false);
      }
    },
    [uploadThumbnail, selectedChannel, fetchThumbnails]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
  });

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this thumbnail?')) return;
    try {
      await deleteThumbnail(id);
      toast.success('Thumbnail deleted successfully');
    } catch {
      toast.error('Failed to delete thumbnail');
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await setDefaultThumbnail(id);
      toast.success('Default thumbnail updated');
    } catch {
      toast.error('Failed to set default thumbnail');
    }
  };

  const filteredThumbnails = thumbnails.filter((t) => {
    const matchesSearch = t.originalName
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesChannel = !selectedChannel || t.channel?.id === selectedChannel;
    return matchesSearch && matchesChannel;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Thumbnails
          </h1>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            Upload and manage your stream thumbnails.
          </p>
        </div>
      </div>

      {/* Upload Zone */}
      <Card>
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={`cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
              isDragActive
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                : 'border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-4 text-sm font-medium text-gray-700 dark:text-gray-200">
              {isDragActive
                ? 'Drop the files here...'
                : 'Drag & drop thumbnails here, or click to select'}
            </p>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Supports: JPG, PNG, GIF, WebP (max 10MB)
            </p>
            {loading && (
              <div className="mt-4">
                <Loading size="sm" />
                <p className="mt-2 text-sm text-gray-500">Uploading...</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search thumbnails..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex h-10 w-full rounded-md border border-gray-300 bg-white pl-10 pr-3 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </div>
        <select
          value={selectedChannel}
          onChange={(e) => setSelectedChannel(e.target.value)}
          className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        >
          <option value="">All Channels</option>
          {channels.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Thumbnail Grid */}
      {filteredThumbnails.length === 0 ? (
        <EmptyState
          icon={Image}
          title="No thumbnails yet"
          description="Upload your first thumbnail to get started."
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredThumbnails.map((thumbnail) => (
            <Card key={thumbnail.id} className="overflow-hidden">
              <div className="relative aspect-video bg-gray-100 dark:bg-gray-700">
                <img
                  src={`/uploads/${thumbnail.filename}`}
                  alt={thumbnail.originalName}
                  className="h-full w-full object-cover"
                />
                {thumbnail.isDefault && (
                  <div className="absolute left-2 top-2">
                    <Badge variant="success">
                      <Star className="mr-1 h-3 w-3" />
                      Default
                    </Badge>
                  </div>
                )}
              </div>
              <CardContent className="p-4">
                <h4 className="truncate font-medium text-gray-900 dark:text-white">
                  {thumbnail.originalName}
                </h4>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <span>{formatFileSize(thumbnail.size)}</span>
                  {thumbnail.width && thumbnail.height && (
                    <span>
                      {thumbnail.width}x{thumbnail.height}
                    </span>
                  )}
                  <span>{formatDate(thumbnail.createdAt)}</span>
                </div>
                {thumbnail.channel && (
                  <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                    {thumbnail.channel.name}
                  </p>
                )}
                <div className="mt-3 flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSetDefault(thumbnail.id)}
                    disabled={thumbnail.isDefault}
                  >
                    {thumbnail.isDefault ? (
                      <StarOff className="mr-1 h-3 w-3" />
                    ) : (
                      <Star className="mr-1 h-3 w-3" />
                    )}
                    {thumbnail.isDefault ? 'Default' : 'Set Default'}
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleDelete(thumbnail.id)}
                  >
                    <Trash2 className="mr-1 h-3 w-3" />
                    Delete
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
