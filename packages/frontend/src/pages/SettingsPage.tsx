import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import {
  User,
  Tv,
  Bell,
  Shield,
  Palette,
  Moon,
  Sun,
  Plus,
  Trash2,
  Edit,
  Save,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Common/Card';
import Button from '@/components/Common/Button';
import Input from '@/components/Common/Input';
import Textarea from '@/components/Common/Textarea';
import Modal from '@/components/Common/Modal';
import Badge from '@/components/Common/Badge';
import toast from 'react-hot-toast';

interface ChannelFormData {
  youtubeId: string;
  name: string;
  description: string;
  thumbnailUrl: string;
}

const initialChannelFormData: ChannelFormData = {
  youtubeId: '',
  name: '',
  description: '',
  thumbnailUrl: '',
};

export default function SettingsPage() {
  const {
    user,
    channels,
    darkMode,
    toggleDarkMode,
    fetchChannels,
    createChannel,
    updateChannel,
    deleteChannel,
    fetchProfile,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState('profile');
  const [showChannelModal, setShowChannelModal] = useState(false);
  const [editingChannel, setEditingChannel] = useState<typeof channels[0] | null>(
    null
  );
  const [channelForm, setChannelForm] = useState<ChannelFormData>(
    initialChannelFormData
  );

  useEffect(() => {
    fetchChannels();
    fetchProfile();
  }, [fetchChannels, fetchProfile]);

  const handleOpenChannelModal = (channel?: typeof channels[0]) => {
    if (channel) {
      setEditingChannel(channel);
      setChannelForm({
        youtubeId: channel.youtubeId,
        name: channel.name,
        description: channel.description || '',
        thumbnailUrl: channel.thumbnailUrl || '',
      });
    } else {
      setEditingChannel(null);
      setChannelForm(initialChannelFormData);
    }
    setShowChannelModal(true);
  };

  const handleCloseChannelModal = () => {
    setShowChannelModal(false);
    setEditingChannel(null);
    setChannelForm(initialChannelFormData);
  };

  const handleSaveChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = channelForm as unknown as Record<string, unknown>;
      if (editingChannel) {
        await updateChannel(editingChannel.id, data);
        toast.success('Channel updated successfully');
      } else {
        await createChannel(data);
        toast.success('Channel added successfully');
      }
      handleCloseChannelModal();
      fetchChannels();
    } catch {
      toast.error('Failed to save channel');
    }
  };

  const handleDeleteChannel = async (id: string) => {
    if (!confirm('Are you sure you want to delete this channel?')) return;
    try {
      await deleteChannel(id);
      toast.success('Channel deleted successfully');
    } catch {
      toast.error('Failed to delete channel');
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'channels', label: 'Channels', icon: Tv },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Settings
        </h1>
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          Manage your account and application preferences.
        </p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-64 flex-shrink-0">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400'
                      : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <Card>
              <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
                    {user?.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="h-20 w-20 rounded-full"
                      />
                    ) : (
                      <User className="h-8 w-8 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <Button variant="outline" size="sm">
                      Change Avatar
                    </Button>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      JPG, PNG or GIF. Max 2MB.
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Name"
                    defaultValue={user?.name}
                    placeholder="Your name"
                  />
                  <Input
                    label="Email"
                    type="email"
                    defaultValue={user?.email}
                    placeholder="your@email.com"
                    disabled
                  />
                </div>

                <div className="flex justify-end">
                  <Button>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Channels Tab */}
          {activeTab === 'channels' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>YouTube Channels</CardTitle>
                <Button onClick={() => handleOpenChannelModal()}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Channel
                </Button>
              </CardHeader>
              <CardContent>
                {channels.length === 0 ? (
                  <div className="py-8 text-center">
                    <Tv className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" />
                    <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                      No channels added yet.
                    </p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => handleOpenChannelModal()}
                    >
                      Add your first channel
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {channels.map((channel) => (
                      <div
                        key={channel.id}
                        className="flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-gray-700"
                      >
                        <div className="flex items-center gap-4">
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
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {channel.name}
                            </h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {channel.subscriberCount.toLocaleString()} subscribers
                              {' • '}
                              {channel._count.schedules} schedules
                            </p>
                          </div>
                          <Badge
                            variant={channel.isActive ? 'success' : 'secondary'}
                          >
                            {channel.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleOpenChannelModal(channel)}
                            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 dark:hover:bg-gray-700"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteChannel(channel.id)}
                            className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Appearance Tab */}
          {activeTab === 'appearance' && (
            <Card>
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {darkMode ? (
                      <Moon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    ) : (
                      <Sun className="h-5 w-5 text-yellow-500" />
                    )}
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        Dark Mode
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Toggle dark mode for the application
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={toggleDarkMode}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      darkMode ? 'bg-primary-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        darkMode ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  {
                    title: 'Stream Reminders',
                    description: 'Get notified before scheduled streams',
                    defaultChecked: true,
                  },
                  {
                    title: 'Schedule Changes',
                    description: 'Notifications when schedules are modified',
                    defaultChecked: true,
                  },
                  {
                    title: 'Key Expiration',
                    description: 'Alerts when stream keys are about to expire',
                    defaultChecked: true,
                  },
                  {
                    title: 'Weekly Summary',
                    description: 'Receive a weekly summary of your activity',
                    defaultChecked: false,
                  },
                ].map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {item.title}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {item.description}
                      </p>
                    </div>
                    <button
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        item.defaultChecked ? 'bg-primary-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          item.defaultChecked
                            ? 'translate-x-6'
                            : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    Change Password
                  </h4>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Update your account password
                  </p>
                  <div className="mt-4 space-y-4">
                    <Input
                      label="Current Password"
                      type="password"
                      placeholder="Enter current password"
                    />
                    <Input
                      label="New Password"
                      type="password"
                      placeholder="Enter new password"
                    />
                    <Input
                      label="Confirm New Password"
                      type="password"
                      placeholder="Confirm new password"
                    />
                    <Button>Update Password</Button>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-6 dark:border-gray-700">
                  <h4 className="font-medium text-red-600 dark:text-red-400">
                    Danger Zone
                  </h4>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Permanently delete your account and all associated data
                  </p>
                  <Button variant="danger" className="mt-4">
                    Delete Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Channel Modal */}
      <Modal
        isOpen={showChannelModal}
        onClose={handleCloseChannelModal}
        title={editingChannel ? 'Edit Channel' : 'Add Channel'}
        size="md"
      >
        <form onSubmit={handleSaveChannel} className="space-y-4">
          <Input
            label="YouTube Channel ID"
            value={channelForm.youtubeId}
            onChange={(e) =>
              setChannelForm({ ...channelForm, youtubeId: e.target.value })
            }
            placeholder="UC..."
            required
            disabled={!!editingChannel}
          />

          <Input
            label="Channel Name"
            value={channelForm.name}
            onChange={(e) =>
              setChannelForm({ ...channelForm, name: e.target.value })
            }
            placeholder="My Gaming Channel"
            required
          />

          <Textarea
            label="Description"
            value={channelForm.description}
            onChange={(e) =>
              setChannelForm({ ...channelForm, description: e.target.value })
            }
            placeholder="Brief description of your channel..."
            rows={3}
          />

          <Input
            label="Thumbnail URL"
            value={channelForm.thumbnailUrl}
            onChange={(e) =>
              setChannelForm({ ...channelForm, thumbnailUrl: e.target.value })
            }
            placeholder="https://..."
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseChannelModal}
            >
              Cancel
            </Button>
            <Button type="submit">
              {editingChannel ? 'Update' : 'Add'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
