import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import {
  Calendar,
  Image,
  Key,
  Tv,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Common/Card';
import StatCard from '@/components/Common/StatCard';
import Badge from '@/components/Common/Badge';
import { formatDateTime, formatDuration } from '@/lib/utils';
import api from '@/lib/api';
import { StreamSchedule } from '@/types';

export default function DashboardPage() {
  const { channels, schedules, thumbnails, streamKeys } = useAppStore();
  const [upcomingStreams, setUpcomingStreams] = useState<StreamSchedule[]>([]);

  useEffect(() => {
    const fetchUpcoming = async () => {
      try {
        const response = await api.getUpcomingSchedules(5);
        setUpcomingStreams(response.data);
      } catch (error) {
        console.error('Failed to fetch upcoming streams:', error);
      }
    };
    fetchUpcoming();
  }, []);

  const stats = {
    totalChannels: channels.length,
    activeChannels: channels.filter((c) => c.isActive).length,
    totalSchedules: schedules.length,
    upcomingStreams: upcomingStreams.length,
    totalThumbnails: thumbnails.length,
    totalStreamKeys: streamKeys.length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Dashboard
        </h1>
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          Welcome back! Here's an overview of your YouTube Live management.
        </p>
      </div>

      {/* Stats Grid */}
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

      {/* Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming Streams */}
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

        {/* Quick Actions */}
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

      {/* Recent Channels */}
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
