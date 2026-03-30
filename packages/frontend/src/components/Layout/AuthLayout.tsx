import { Outlet, Navigate } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';

export default function AuthLayout() {
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  const token = localStorage.getItem('token');

  if (isAuthenticated || token) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-600">
            <svg
              className="h-8 w-8 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">YouTube Live Manager</h1>
          <p className="mt-2 text-gray-400">
            Manage your YouTube live streams with ease
          </p>
        </div>
        <div className="rounded-xl bg-white p-8 shadow-2xl dark:bg-gray-800">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
