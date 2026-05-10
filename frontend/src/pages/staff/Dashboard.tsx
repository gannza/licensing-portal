import { Link } from 'react-router-dom';
import { useGetApplicationsQuery } from '../../api/applicationsApi';
import { useAuth } from '../../hooks/useAuth';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function StaffDashboard() {
  const { user } = useAuth();
  const { data, isLoading } = useGetApplicationsQuery({});

  const activeApps = data?.data?.filter(a => !['APPROVED', 'REJECTED'].includes(a.current_state)) || [];
  const closedApps = data?.data?.filter(a => ['APPROVED', 'REJECTED'].includes(a.current_state)) || [];

  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="text-xl font-bold text-brand-base">Staff Dashboard</h2>
        <p className="text-gray-500 text-sm mt-1">
          Welcome, {user?.full_name}. Review and action the applications assigned to your workflow.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Active Applications', value: activeApps.length, color: 'bg-brand-primary/20' },
          { label: 'Awaiting Your Action', value: activeApps.length, color: 'bg-brand-special/10' },
          { label: 'Completed', value: closedApps.length, color: 'bg-green-50' },
        ].map(stat => (
          <div key={stat.label} className={`card ${stat.color}`}>
            <p className="text-3xl font-bold text-brand-base">{stat.value}</p>
            <p className="text-sm text-gray-600 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Applications Queue */}
      <div className="card">
        <h3 className="text-lg font-semibold text-brand-base mb-4">List of Applications</h3>

        {isLoading && <LoadingSpinner />}

        {!isLoading && (!data?.data || data.data.length === 0) && (
          <div className="text-center py-12">
            <p className="text-gray-400">No applications assigned to your workflow.</p>
          </div>
        )}

        {data?.data && data.data.length > 0 && (
          <div className="space-y-3">
            {data.data.map(app => (
              <Link
                key={app.id}
                to={`/app/applications/${app.id}`}
                className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:border-brand-primary hover:bg-brand-secondary/10 transition-all"
              >
                <div>
                  <p className="font-medium text-gray-800">{app.type_name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Applicant: {app.applicant_name} &middot; Updated {new Date(app.updated_at).toLocaleDateString()}
                  </p>
                </div>
                <StatusBadge state={app.current_state} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
