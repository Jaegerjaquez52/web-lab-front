import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router';
import Layout from '@/components/layout/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import HomePage from '@/pages/HomePage';
import Loading from '@/components/common/Loading';

const AboutPage = lazy(() => import('@/pages/AboutPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/RegisterPage'));
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const UsersListPage = lazy(() => import('@/pages/UsersListPage'));
const UserCreatePage = lazy(() => import('@/pages/UserCreatePage'));
const UserEditPage = lazy(() => import('@/pages/UserEditPage'));
const ProjectsPage = lazy(() => import('@/pages/ProjectsPage'));
const ProjectDetailsPage = lazy(() => import('@/pages/ProjectDetailsPage'));
const TeamsPage = lazy(() => import('@/pages/TeamsPage'));
const TasksPage = lazy(() => import('@/pages/TasksPage'));
const NotificationsPage = lazy(() => import('@/pages/NotificationsPage'));
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="users" element={<ProtectedRoute><UsersListPage /></ProtectedRoute>} />
            <Route path="users/create" element={<ProtectedRoute><UserCreatePage /></ProtectedRoute>} />
            <Route path="users/:id/edit" element={<ProtectedRoute><UserEditPage /></ProtectedRoute>} />
            <Route path="projects" element={<ProtectedRoute><ProjectsPage /></ProtectedRoute>} />
            <Route path="projects/:id" element={<ProtectedRoute><ProjectDetailsPage /></ProtectedRoute>} />
            <Route path="teams" element={<ProtectedRoute><TeamsPage /></ProtectedRoute>} />
            <Route path="tasks" element={<ProtectedRoute><TasksPage /></ProtectedRoute>} />
            <Route path="notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
            <Route path="profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}