import { useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAppStore } from '@/store/useAppStore';

// Layouts
import MainLayout from '@/components/Layout/MainLayout';
import AuthLayout from '@/components/Layout/AuthLayout';

// Pages
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import DashboardPage from '@/pages/DashboardPage';
import SchedulePage from '@/pages/SchedulePage';
import ThumbnailPage from '@/pages/ThumbnailPage';
import MetadataPage from '@/pages/MetadataPage';
import StreamKeyPage from '@/pages/StreamKeyPage';
import VideoPage from '@/pages/VideoPage';
import SettingsPage from '@/pages/SettingsPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  const token = localStorage.getItem('token');

  if (!isAuthenticated && !token) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function App() {
  const { darkMode, fetchProfile, isAuthenticated } = useAppStore();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  useEffect(() => {
    if (isAuthenticated || localStorage.getItem('token')) {
      fetchProfile();
    }
  }, [isAuthenticated, fetchProfile]);

  return (
    <Router>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          className: 'dark:bg-gray-800 dark:text-white',
        }}
      />
      <Routes>
        {/* Auth Routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        {/* Protected Routes */}
        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<DashboardPage />} />
          <Route path="/schedules" element={<SchedulePage />} />
          <Route path="/thumbnails" element={<ThumbnailPage />} />
          <Route path="/videos" element={<VideoPage />} />
          <Route path="/metadata" element={<MetadataPage />} />
          <Route path="/stream-keys" element={<StreamKeyPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        {/* Redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
