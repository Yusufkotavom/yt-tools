import { useEffect, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Plus, FileText, Edit, Trash2, Search, Eye, Copy } from 'lucide-react';
import Button from '@/components/Common/Button';
import Modal from '@/components/Common/Modal';
import Input from '@/components/Common/Input';
import Textarea from '@/components/Common/Textarea';
import Select from '@/components/Common/Select';
import Badge from '@/components/Common/Badge';
import EmptyState from '@/components/Common/EmptyState';
import { Card, CardContent } from '@/components/Common/Card';
import { formatDate, truncate } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Metadata } from '@/types';

interface MetadataFormData {
  title: string;
  description: string;
  tags: string;
  categoryId: string;
  defaultLanguage: string;
  privacyStatus: string;
  channelId: string;
}

const initialFormData: MetadataFormData = {
  title: '',
  description: '',
  tags: '',
  categoryId: '',
  defaultLanguage: 'en',
  privacyStatus: 'public',
  channelId: '',
};

const categoryOptions = [
  { value: '1', label: 'Film & Animation' },
  { value: '2', label: 'Autos & Vehicles' },
  { value: '10', label: 'Music' },
  { value: '15', label: 'Pets & Animals' },
  { value: '17', label: 'Sports' },
  { value: '19', label: 'Travel & Events' },
  { value: '20', label: 'Gaming' },
  { value: '22', label: 'People & Blogs' },
  { value: '23', label: 'Comedy' },
  { value: '24', label: 'Entertainment' },
  { value: '25', label: 'News & Politics' },
  { value: '26', label: 'Howto & Style' },
  { value: '27', label: 'Education' },
  { value: '28', label: 'Science & Technology' },
];

const languageOptions = [
  { value: 'en', label: 'English' },
  { value: 'id', label: 'Indonesian' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'ja', label: 'Japanese' },
  { value: 'ko', label: 'Korean' },
];

const privacyOptions = [
  { value: 'public', label: 'Public' },
  { value: 'unlisted', label: 'Unlisted' },
  { value: 'private', label: 'Private' },
];

export default function MetadataPage() {
  const {
    metadata,
    channels,
    fetchMetadata,
    fetchChannels,
    createMetadata,
    updateMetadata,
    deleteMetadata,
  } = useAppStore();

  const [showModal, setShowModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [editingMetadata, setEditingMetadata] = useState<Metadata | null>(null);
  const [previewData, setPreviewData] = useState<Metadata | null>(null);
  const [formData, setFormData] = useState<MetadataFormData>(initialFormData);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchChannels();
    fetchMetadata();
  }, [fetchChannels, fetchMetadata]);

  const handleOpenModal = (data?: Metadata) => {
    if (data) {
      setEditingMetadata(data);
      setFormData({
        title: data.title,
        description: data.description || '',
        tags: data.tags || '',
        categoryId: data.categoryId || '',
        defaultLanguage: data.defaultLanguage || 'en',
        privacyStatus: data.privacyStatus,
        channelId: data.channel.id,
      });
    } else {
      setEditingMetadata(null);
      setFormData(initialFormData);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingMetadata(null);
    setFormData(initialFormData);
  };

  const handlePreview = (data: Metadata) => {
    setPreviewData(data);
    setShowPreview(true);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = formData as unknown as Record<string, unknown>;
      if (editingMetadata) {
        await updateMetadata(editingMetadata.id, data);
        toast.success('Metadata updated successfully');
      } else {
        await createMetadata(data);
        toast.success('Metadata created successfully');
      }
      handleCloseModal();
      fetchMetadata();
    } catch {
      toast.error('Failed to save metadata');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this metadata?')) return;
    try {
      await deleteMetadata(id);
      toast.success('Metadata deleted successfully');
    } catch {
      toast.error('Failed to delete metadata');
    }
  };

  const filteredMetadata = metadata.filter((m) =>
    m.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Metadata Templates
          </h1>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            Create and manage reusable metadata templates for your streams.
          </p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="mr-2 h-4 w-4" />
          New Template
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search templates..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex h-10 w-full rounded-md border border-gray-300 bg-white pl-10 pr-3 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        />
      </div>

      {/* Metadata List */}
      {filteredMetadata.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No metadata templates yet"
          description="Create your first metadata template to get started."
          action={{
            label: 'Create Template',
            onClick: () => handleOpenModal(),
          }}
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {filteredMetadata.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {item.title}
                    </h3>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Badge
                        variant={
                          item.privacyStatus === 'public'
                            ? 'success'
                            : item.privacyStatus === 'unlisted'
                            ? 'warning'
                            : 'danger'
                        }
                      >
                        {item.privacyStatus}
                      </Badge>
                      <Badge variant="secondary">{item.channel.name}</Badge>
                    </div>
                    {item.description && (
                      <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                        {truncate(item.description, 150)}
                      </p>
                    )}
                    {item.tags && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {item.tags
                          .split(',')
                          .slice(0, 5)
                          .map((tag, i) => (
                            <span
                              key={i}
                              className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                            >
                              #{tag.trim()}
                            </span>
                          ))}
                      </div>
                    )}
                    <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
                      Created: {formatDate(item.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handlePreview(item)}
                      className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 dark:hover:bg-gray-700"
                      title="Preview"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() =>
                        handleCopy(
                          `${item.title}\n\n${item.description || ''}\n\n${item.tags || ''}`
                        )
                      }
                      className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 dark:hover:bg-gray-700"
                      title="Copy"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleOpenModal(item)}
                      className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 dark:hover:bg-gray-700"
                      title="Edit"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
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

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingMetadata ? 'Edit Metadata' : 'Create Metadata'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Title"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            placeholder="Stream title"
            required
          />

          <Textarea
            label="Description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder="Describe your stream..."
            rows={5}
          />

          <Input
            label="Tags"
            value={formData.tags}
            onChange={(e) =>
              setFormData({ ...formData, tags: e.target.value })
            }
            placeholder="gaming, livestream, community"
            helper="Separate tags with commas"
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

          <div className="grid gap-4 sm:grid-cols-3">
            <Select
              label="Category"
              value={formData.categoryId}
              onChange={(e) =>
                setFormData({ ...formData, categoryId: e.target.value })
              }
              options={categoryOptions}
              placeholder="Select category"
            />

            <Select
              label="Language"
              value={formData.defaultLanguage}
              onChange={(e) =>
                setFormData({ ...formData, defaultLanguage: e.target.value })
              }
              options={languageOptions}
            />

            <Select
              label="Privacy"
              value={formData.privacyStatus}
              onChange={(e) =>
                setFormData({ ...formData, privacyStatus: e.target.value })
              }
              options={privacyOptions}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button type="submit">
              {editingMetadata ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Preview Modal */}
      <Modal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        title="Metadata Preview"
        size="lg"
      >
        {previewData && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Title
              </label>
              <p className="mt-1 text-gray-900 dark:text-white">
                {previewData.title}
              </p>
            </div>
            {previewData.description && (
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Description
                </label>
                <p className="mt-1 whitespace-pre-wrap text-gray-900 dark:text-white">
                  {previewData.description}
                </p>
              </div>
            )}
            {previewData.tags && (
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Tags
                </label>
                <p className="mt-1 text-gray-900 dark:text-white">
                  {previewData.tags}
                </p>
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Privacy
                </label>
                <p className="mt-1">
                  <Badge
                    variant={
                      previewData.privacyStatus === 'public'
                        ? 'success'
                        : previewData.privacyStatus === 'unlisted'
                        ? 'warning'
                        : 'danger'
                    }
                  >
                    {previewData.privacyStatus}
                  </Badge>
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Channel
                </label>
                <p className="mt-1 text-gray-900 dark:text-white">
                  {previewData.channel.name}
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
