import { useEffect, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import {
  Key,
  Plus,
  Eye,
  EyeOff,
  Copy,
  Edit,
  Trash2,
  Power,
  Search,
  Clock,
  Settings,
} from 'lucide-react';
import Button from '@/components/Common/Button';
import Modal from '@/components/Common/Modal';
import Input from '@/components/Common/Input';
import Select from '@/components/Common/Select';
import Badge from '@/components/Common/Badge';
import EmptyState from '@/components/Common/EmptyState';
import { Card, CardContent } from '@/components/Common/Card';
import { formatDateTime } from '@/lib/utils';
import toast from 'react-hot-toast';
import { StreamKey } from '@/types';

interface StreamKeyFormData {
  name: string;
  keyValue: string;
  serverUrl: string;
  channelId: string;
  bitrate: string;
  resolution: string;
  framerate: string;
  codec: string;
}

const initialFormData: StreamKeyFormData = {
  name: '',
  keyValue: '',
  serverUrl: 'rtmp://a.rtmp.youtube.com/live2',
  channelId: '',
  bitrate: '4500',
  resolution: '1920x1080',
  framerate: '60',
  codec: 'h264',
};

const resolutionOptions = [
  { value: '1920x1080', label: '1080p (1920x1080)' },
  { value: '1280x720', label: '720p (1280x720)' },
  { value: '854x480', label: '480p (854x480)' },
  { value: '640x360', label: '360p (640x360)' },
  { value: '2560x1440', label: '1440p (2560x1440)' },
  { value: '3840x2160', label: '4K (3840x2160)' },
];

const framerateOptions = [
  { value: '30', label: '30 FPS' },
  { value: '60', label: '60 FPS' },
];

const codecOptions = [
  { value: 'h264', label: 'H.264' },
  { value: 'h265', label: 'H.265 (HEVC)' },
  { value: 'vp9', label: 'VP9' },
];

export default function StreamKeyPage() {
  const {
    streamKeys,
    channels,
    fetchStreamKeys,
    fetchChannels,
    createStreamKey,
    updateStreamKey,
    deleteStreamKey,
    toggleStreamKey,
  } = useAppStore();

  const [showModal, setShowModal] = useState(false);
  const [editingKey, setEditingKey] = useState<StreamKey | null>(null);
  const [formData, setFormData] = useState<StreamKeyFormData>(initialFormData);
  const [searchTerm, setSearchTerm] = useState('');
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchChannels();
    fetchStreamKeys();
  }, [fetchChannels, fetchStreamKeys]);

  const handleOpenModal = (key?: StreamKey) => {
    if (key) {
      setEditingKey(key);
      setFormData({
        name: key.name,
        keyValue: key.keyValue,
        serverUrl: key.serverUrl || 'rtmp://a.rtmp.youtube.com/live2',
        channelId: key.channel.id,
        bitrate: key.bitrate?.toString() || '4500',
        resolution: key.resolution || '1920x1080',
        framerate: key.framerate?.toString() || '60',
        codec: key.codec || 'h264',
      });
    } else {
      setEditingKey(null);
      setFormData(initialFormData);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingKey(null);
    setFormData(initialFormData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        bitrate: parseInt(formData.bitrate) || 4500,
        framerate: parseInt(formData.framerate) || 60,
      };

      if (editingKey) {
        await updateStreamKey(editingKey.id, data);
        toast.success('Stream key updated successfully');
      } else {
        await createStreamKey(data);
        toast.success('Stream key created successfully');
      }
      handleCloseModal();
      fetchStreamKeys();
    } catch {
      toast.error('Failed to save stream key');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this stream key?')) return;
    try {
      await deleteStreamKey(id);
      toast.success('Stream key deleted successfully');
    } catch {
      toast.error('Failed to delete stream key');
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await toggleStreamKey(id);
      toast.success('Stream key status updated');
    } catch {
      toast.error('Failed to toggle stream key');
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const toggleShowKey = (id: string) => {
    setShowKeys((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const maskKey = (key: string) => {
    if (key.length <= 8) return '••••••••';
    return key.slice(0, 4) + '••••••••' + key.slice(-4);
  };

  const filteredKeys = streamKeys.filter((k) =>
    k.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Stream Keys
          </h1>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            Manage your stream keys and encoder settings.
          </p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="mr-2 h-4 w-4" />
          Add Stream Key
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search stream keys..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex h-10 w-full rounded-md border border-gray-300 bg-white pl-10 pr-3 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        />
      </div>

      {/* Stream Keys List */}
      {filteredKeys.length === 0 ? (
        <EmptyState
          icon={Key}
          title="No stream keys yet"
          description="Add your first stream key to get started."
          action={{
            label: 'Add Stream Key',
            onClick: () => handleOpenModal(),
          }}
        />
      ) : (
        <div className="space-y-4">
          {filteredKeys.map((streamKey) => (
            <Card key={streamKey.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {streamKey.name}
                      </h3>
                      <Badge variant={streamKey.isActive ? 'success' : 'secondary'}>
                        {streamKey.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      <Badge variant="outline">{streamKey.channel.name}</Badge>
                    </div>

                    {/* Stream Key */}
                    <div className="mt-4 rounded-lg bg-gray-50 p-4 dark:bg-gray-700/50">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                            Stream Key
                          </label>
                          <p className="mt-1 font-mono text-sm text-gray-900 dark:text-white">
                            {showKeys[streamKey.id]
                              ? streamKey.keyValue
                              : maskKey(streamKey.keyValue)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleShowKey(streamKey.id)}
                            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 dark:hover:bg-gray-700"
                          >
                            {showKeys[streamKey.id] ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            onClick={() =>
                              handleCopy(streamKey.keyValue, 'Stream key')
                            }
                            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 dark:hover:bg-gray-700"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {streamKey.serverUrl && (
                        <div className="mt-3 flex items-center justify-between border-t border-gray-200 pt-3 dark:border-gray-600">
                          <div>
                            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                              Server URL
                            </label>
                            <p className="mt-1 font-mono text-sm text-gray-900 dark:text-white">
                              {streamKey.serverUrl}
                            </p>
                          </div>
                          <button
                            onClick={() =>
                              handleCopy(
                                streamKey.serverUrl || '',
                                'Server URL'
                              )
                            }
                            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 dark:hover:bg-gray-700"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Encoder Settings */}
                    <div className="mt-4 flex flex-wrap items-center gap-4">
                      {streamKey.resolution && (
                        <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                          <Settings className="h-4 w-4" />
                          {streamKey.resolution}
                        </div>
                      )}
                      {streamKey.framerate && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {streamKey.framerate} FPS
                        </div>
                      )}
                      {streamKey.bitrate && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {streamKey.bitrate} kbps
                        </div>
                      )}
                      {streamKey.codec && (
                        <Badge variant="outline">{streamKey.codec.toUpperCase()}</Badge>
                      )}
                    </div>

                    {/* Last Used */}
                    {streamKey.lastUsedAt && (
                      <div className="mt-3 flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                        <Clock className="h-3 w-3" />
                        Last used: {formatDateTime(streamKey.lastUsedAt)}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggle(streamKey.id)}
                      className={`rounded-lg p-2 ${
                        streamKey.isActive
                          ? 'text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20'
                          : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                      title={streamKey.isActive ? 'Deactivate' : 'Activate'}
                    >
                      <Power className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleOpenModal(streamKey)}
                      className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 dark:hover:bg-gray-700"
                      title="Edit"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(streamKey.id)}
                      className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingKey ? 'Edit Stream Key' : 'Add Stream Key'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Name"
            value={formData.name}
            onChange={(e) =>
              setFormData({ ...formData, name: e.target.value })
            }
            placeholder="e.g., OBS Studio Key"
            required
          />

          <Input
            label="Stream Key"
            value={formData.keyValue}
            onChange={(e) =>
              setFormData({ ...formData, keyValue: e.target.value })
            }
            placeholder="xxxx-xxxx-xxxx-xxxx-xxxx"
            required
          />

          <Input
            label="Server URL"
            value={formData.serverUrl}
            onChange={(e) =>
              setFormData({ ...formData, serverUrl: e.target.value })
            }
            placeholder="rtmp://a.rtmp.youtube.com/live2"
          />

          <Select
            label="Channel"
            value={formData.channelId}
            onChange={(e) =>
              setFormData({ ...formData, channelId: e.target.value })
            }
            options={channels.map((c) => ({ value: c.id, label: c.name }))}
            placeholder="Select channel"
            required
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Resolution"
              value={formData.resolution}
              onChange={(e) =>
                setFormData({ ...formData, resolution: e.target.value })
              }
              options={resolutionOptions}
            />

            <Select
              label="Framerate"
              value={formData.framerate}
              onChange={(e) =>
                setFormData({ ...formData, framerate: e.target.value })
              }
              options={framerateOptions}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Bitrate (kbps)"
              type="number"
              value={formData.bitrate}
              onChange={(e) =>
                setFormData({ ...formData, bitrate: e.target.value })
              }
              placeholder="4500"
            />

            <Select
              label="Codec"
              value={formData.codec}
              onChange={(e) =>
                setFormData({ ...formData, codec: e.target.value })
              }
              options={codecOptions}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button type="submit">
              {editingKey ? 'Update' : 'Add'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
