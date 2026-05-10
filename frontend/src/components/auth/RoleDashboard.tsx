import { useAuth } from '../../hooks/useAuth';
import ApplicantDashboard from '../../pages/applicant/Dashboard';
import StaffDashboard from '../../pages/staff/Dashboard';
import AdminDashboard from '../../pages/admin/Dashboard';

export default function RoleDashboard() {
  const { user } = useAuth();
  if (!user) return null;
  if (user.system_role === 'APPLICANT') return <ApplicantDashboard />;
  if (user.system_role === 'STAFF') return <StaffDashboard />;
  return <AdminDashboard />;
}
