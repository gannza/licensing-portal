import { Link } from 'react-router-dom';
import { useGetUsersQuery, useGetAdminApplicationsQuery } from '../../api/adminApi';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatusBadge from '../../components/common/StatusBadge';

export default function AdminDashboard() {
  const { data: usersData, isLoading: usersLoading } = useGetUsersQuery({});
  const { data: appsData, isLoading: appsLoading } = useGetAdminApplicationsQuery({});

  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="text-xl font-bold text-brand-base">Admin Dashboard</h2>
        <p className="text-gray-500 text-sm mt-1">System overview and management.</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Users', value: usersData?.pagination?.total ?? '—', to: '/app/admin/users' },
          { label: 'Total Applications', value: appsData?.pagination?.total ?? '—', to: '/app' },
          { label: 'Audit Events', value: '—', to: '/app/admin/audit-logs' },
        ].map(stat => (
          <Link
            key={stat.label}
            to={stat.to}
            className="card hover:border-brand-primary border-2 border-transparent transition-all"
          >
            <p className="text-3xl font-bold text-brand-base">{stat.value}</p>
            <p className="text-sm text-gray-600 mt-1">{stat.label}</p>
          </Link>
        ))}
      </div>

      {/* Recent Applications */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-brand-base">List of Applications</h3>
        </div>
        {(appsLoading || usersLoading) && <LoadingSpinner />}
        {appsData?.data?.slice(0, 10).map(app => (
          <Link
            key={app.id}
            to={`/app/applications/${app.id}`}
            className="flex items-center justify-between p-3 border-b border-gray-50 hover:bg-gray-50 transition-colors"
          >
            <div>
              <p className="text-sm font-medium text-gray-800">{app.type_name}</p>
              <p className="text-xs text-gray-400">
                {app.applicant_name} &middot; {new Date(app.updated_at).toLocaleDateString()}
              </p>
            </div>
            <StatusBadge state={app.current_state} />
          </Link>
        ))}
      </div>
    </div>
  );
}
