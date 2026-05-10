import { useAuth } from '../hooks/useAuth';
import ApplicationDetailApplicant from './applicant/ApplicationDetail';
import ApplicationDetailStaff from './staff/ApplicationDetail';

export default function ApplicationDetailPage() {
  const { user } = useAuth();
  if (user?.system_role === 'APPLICANT') return <ApplicationDetailApplicant />;
  return <ApplicationDetailStaff />;
}
