import { Link } from 'react-router-dom';
import { useGetApplicationsQuery } from '../../api/applicationsApi';
import { useAuth } from '../../hooks/useAuth';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function ApplicantDashboard() {
  const { user } = useAuth();
  const { data, isLoading, error } = useGetApplicationsQuery({});

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="card">
        <h2 className="text-xl font-bold text-brand-base">Welcome, {user?.full_name}</h2>
        <p className="text-gray-500 text-sm mt-1">
          Manage your bank licensing applications with the National Bank of Rwanda.
        </p>
        <Link to="/app/applications/new" className="btn-primary mt-4 inline-block">
          + New Application
        </Link>
      </div>

      {/* Applications */}
      <div className="card">
        <h3 className="text-lg font-semibold text-brand-base mb-4">My Applications</h3>

        {isLoading && <LoadingSpinner />}
        {error && <p className="text-red-500 text-sm">Failed to load applications.</p>}

        {data?.data && data.data.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400 mb-4">No applications yet</p>
            <Link to="/app/applications/new" className="btn-primary">Start your first application</Link>
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
                    Created {new Date(app.created_at).toLocaleDateString()} &middot; Cycle {app.current_submission_cycle}
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
