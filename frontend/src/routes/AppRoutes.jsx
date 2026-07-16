import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';
import { Dashboard } from '../pages/Dashboard';
import { MyFiles } from '../pages/MyFiles';
import { Favorites } from '../pages/Favorites';
import { RecycleBin } from '../pages/RecycleBin';
import { SharedFiles } from '../pages/SharedFiles';
import { Profile } from '../pages/Profile';
import { Settings } from '../pages/Settings';
import { Login } from '../pages/Login';
import { useUserQuery } from '../hooks/useAuth';
import { Loader } from '../components/UI';

const ProtectedRoute = ({ children }) => {
  const { data: user, isLoading } = useUserQuery();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slateBg-light dark:bg-slateBg-darker">
        <Loader size="lg" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="files" element={<MyFiles />} />
        <Route path="folder/:folderId" element={<MyFiles />} />
        <Route path="favorites" element={<Favorites />} />
        <Route path="trash" element={<RecycleBin />} />
        <Route path="shared" element={<SharedFiles />} />
        <Route path="profile" element={<Profile />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
export default AppRoutes;
