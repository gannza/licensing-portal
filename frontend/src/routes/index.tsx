import { createBrowserRouter, Navigate } from 'react-router-dom';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import ChangePasswordPage from '../pages/auth/ChangePasswordPage';
import AppLayout from '../components/layout/AppLayout';
import RequireAuth from '../components/auth/RequireAuth';
import RoleDashboard from '../components/auth/RoleDashboard';
import ApplicationDetailPage from '../pages/ApplicationDetail';
import ApplicationCreate from '../pages/applicant/ApplicationCreate';
import UserManagement from '../pages/admin/UserManagement';
import UserCreate from '../pages/admin/UserCreate';
import AuditLogs from '../pages/admin/AuditLogs';
import ApplicationTypes from '../pages/admin/ApplicationTypes';
import ApplicationTypeDetail from '../pages/admin/ApplicationTypeDetail';
import NotFound from '../pages/NotFound';

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/login" replace /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  { path: '/change-password', element: <ChangePasswordPage /> },
  {
    path: '/app',
    element: <RequireAuth><AppLayout /></RequireAuth>,
    children: [
      { index: true, element: <RoleDashboard /> },
      { path: 'applications/new', element: <ApplicationCreate /> },
      { path: 'applications/:id', element: <ApplicationDetailPage /> },
      { path: 'admin/users', element: <UserManagement /> },
      { path: 'admin/users/new', element: <UserCreate /> },
      { path: 'admin/application-types', element: <ApplicationTypes /> },
      { path: 'admin/application-types/:id', element: <ApplicationTypeDetail /> },
      { path: 'admin/audit-logs', element: <AuditLogs /> },
    ],
  },
  { path: '*', element: <NotFound /> },
]);
