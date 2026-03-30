import { useEffect, useState } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useAppStore } from '@/store/useAppStore';
import { Plus, Calendar as CalendarIcon, List, Edit, Trash2 } from 'lucide-react';
import Button from '@/components/Common/Button';
import Modal from '@/components/Common/Modal';
import Input from '@/components/Common/Input';
import Textarea from '@/components/Common/Textarea';
import Select from '@/components/Common/Select';
import Badge from '@/components/Common/Badge';
import EmptyState from '@/components/Common/EmptyState';
import { formatDateTime, formatDuration } from '@/lib/utils';
import toast from 'react-hot-toast';
import { StreamSchedule } from '@/types';

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface ScheduleFormData {
  title: string;
  description: string;
  scheduledAt: string;
  duration: string;
  timezone: string;
  channelId: string;
  category: string;
  tags: string;
  privacy: string;
}

const initialFormData: ScheduleFormData = {
  title: '',
  description: '',
  scheduledAt: '',
  duration: '60',
  timezone: 'Asia/Jakarta',
  channelId: '',
  category: '',
  tags: '',
  privacy: 'public',
};

export default function SchedulePage() {
  const {
    schedules,
    channels,
    fetchSchedules,
    fetchChannels,
    createSchedule,
    updateSchedule,
    deleteSchedule,
  } = useAppStore();

  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [showModal, setShowModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<StreamSchedule | null>(
    null
  );
  const [formData, setFormData] =
    useState<ScheduleFormData>(initialFormData);

  useEffect(() => {
    fetchChannels();
    fetchSchedules();
  }, [fetchChannels, fetchSchedules]);

  const handleOpenModal = (schedule?: StreamSchedule) => {
    if (schedule) {
      setEditingSchedule(schedule);
      setFormData({
        title: schedule.title,
        description: schedule.description || '',
        scheduledAt: format(new Date(schedule.scheduledAt), "yyyy-MM-dd'T'HH:mm"),
        duration: schedule.duration?.toString() || '60',
        timezone: schedule.timezone,
        channelId: schedule.channel.id,
        category: schedule.category || '',
        tags: schedule.tags || '',
        privacy: schedule.privacy,
      });
    } else {
      setEditingSchedule(null);
      setFormData(initialFormData);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingSchedule(null);
    setFormData(initialFormData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        duration: parseInt(formData.duration) || 60,
      };

      if (editingSchedule) {
        await updateSchedule(editingSchedule.id, data);
        toast.success('Schedule updated successfully');
      } else {
        await createSchedule(data);
        toast.success('Schedule created successfully');
      }
      handleCloseModal();
      fetchSchedules();
    } catch {
      toast.error('Failed to save schedule');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this schedule?')) return;
    try {
      await deleteSchedule(id);
      toast.success('Schedule deleted successfully');
    } catch {
      toast.error('Failed to delete schedule');
    }
  };

  const calendarEvents = schedules.map((schedule) => ({
    id: schedule.id,
    title: schedule.title,
    start: new Date(schedule.scheduledAt),
    end: new Date(
      new Date(schedule.scheduledAt).getTime() +
        (schedule.duration || 60) * 60 * 1000
    ),
    resource: schedule,
  }));

  const eventStyleGetter = (event: { resource: StreamSchedule }) => {
    const status = event.resource.status;
    let backgroundColor = '#3b82f6';
    if (status === 'live') backgroundColor = '#22c55e';
    if (status === 'completed') backgroundColor = '#6b7280';
    if (status === 'cancelled') backgroundColor = '#ef4444';

    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        opacity: 0.9,
        color: 'white',
        border: 'none',
        fontSize: '12px',
      },
    };
  };

  const privacyOptions = [
    { value: 'public', label: 'Public' },
    { value: 'unlisted', label: 'Unlisted' },
    { value: 'private', label: 'Private' },
  ];

  const categoryOptions = [
    { value: 'Gaming', label: 'Gaming' },
    { value: 'Entertainment', label: 'Entertainment' },
    { value: 'Education', label: 'Education' },
    { value: 'Music', label: 'Music' },
    { value: 'Sports', label: 'Sports' },
    { value: 'News', label: 'News' },
    { value: 'Other', label: 'Other' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Stream Schedules
          </h1>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            Plan and manage your upcoming live streams.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setViewMode('calendar')}
              className={`rounded-l-lg px-3 py-2 ${
                viewMode === 'calendar'
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700'
              }`}
            >
              <CalendarIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`rounded-r-lg px-3 py-2 ${
                viewMode === 'list'
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700'
              }`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
          <Button onClick={() => handleOpenModal()}>
            <Plus className="mr-2 h-4 w-4" />
            New Schedule
          </Button>
        </div>
      </div>

      {/* Content */}
      {schedules.length === 0 ? (
        <EmptyState
          icon={CalendarIcon}
          title="No schedules yet"
          description="Create your first stream schedule to get started."
          action={{
            label: 'Create Schedule',
            onClick: () => handleOpenModal(),
          }}
        />
      ) : viewMode === 'calendar' ? (
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <Calendar
            localizer={localizer}
            events={calendarEvents}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 600 }}
            eventPropGetter={eventStyleGetter}
            onSelectEvent={(event) =>
              handleOpenModal(event.resource as StreamSchedule)
            }
            views={['month', 'week', 'day']}
          />
        </div>
      ) : (
        <div className="space-y-4">
          {schedules.map((schedule) => (
            <div
              key={schedule.id}
              className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {schedule.title}
                    </h3>
                    <Badge
                      variant={
                        schedule.status === 'live'
                          ? 'success'
                          : schedule.status === 'scheduled'
                          ? 'default'
                          : schedule.status === 'completed'
                          ? 'secondary'
                          : 'danger'
                      }
                    >
                      {schedule.status}
                    </Badge>
                    <Badge
                      variant={
                        schedule.privacy === 'public'
                          ? 'success'
                          : schedule.privacy === 'unlisted'
                          ? 'warning'
                          : 'danger'
                      }
                    >
                      {schedule.privacy}
                    </Badge>
                  </div>
                  {schedule.description && (
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      {schedule.description}
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <span>{formatDateTime(schedule.scheduledAt)}</span>
                    {schedule.duration && (
                      <span>{formatDuration(schedule.duration)}</span>
                    )}
                    <span>{schedule.channel.name}</span>
                    {schedule.category && <span>{schedule.category}</span>}
                  </div>
                  {schedule.tags && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {schedule.tags.split(',').map((tag, i) => (
                        <span
                          key={i}
                          className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                        >
                          #{tag.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenModal(schedule)}
                    className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 dark:hover:bg-gray-700"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(schedule.id)}
                    className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingSchedule ? 'Edit Schedule' : 'Create Schedule'}
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
            rows={3}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Scheduled Date & Time"
              type="datetime-local"
              value={formData.scheduledAt}
              onChange={(e) =>
                setFormData({ ...formData, scheduledAt: e.target.value })
              }
              required
            />

            <Input
              label="Duration (minutes)"
              type="number"
              value={formData.duration}
              onChange={(e) =>
                setFormData({ ...formData, duration: e.target.value })
              }
              placeholder="60"
            />
          </div>

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
              label="Category"
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
              options={categoryOptions}
              placeholder="Select category"
            />

            <Select
              label="Privacy"
              value={formData.privacy}
              onChange={(e) =>
                setFormData({ ...formData, privacy: e.target.value })
              }
              options={privacyOptions}
            />
          </div>

          <Input
            label="Tags"
            value={formData.tags}
            onChange={(e) =>
              setFormData({ ...formData, tags: e.target.value })
            }
            placeholder="gaming, livestream, community"
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button type="submit">
              {editingSchedule ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
