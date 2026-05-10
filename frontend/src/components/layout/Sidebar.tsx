import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useDispatch } from 'react-redux';
import { logout } from '../../slices/authSlice';
import { useLogoutMutation } from '../../api/authApi';
import { baseApi } from '../../api/baseApi';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
    isActive
      ? 'bg-brand-primary text-brand-base'
      : 'text-gray-600 hover:bg-brand-secondary/40 hover:text-brand-base'
  }`;

export default function Sidebar() {
  const { user } = useAuth();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [logoutApi] = useLogoutMutation();

  const handleLogout = async () => {
    await logoutApi();
    dispatch(baseApi.util.resetApiState());
    dispatch(logout());
    navigate('/login');
  };

  const appName = import.meta.env.VITE_APP_NAME || 'Licensing System';
  const companyName = import.meta.env.VITE_APP_COMPANY_NAME || 'National Bank of Rwanda';
  return (
    <aside className="w-64 bg-white border-r border-gray-100 flex flex-col shadow-sm">
      {/* Logo */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
       
          <div>
            <p className="font-bold text-brand-base text-sm">{companyName}</p>
            <p className="text-xs text-gray-400">{appName}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        <NavLink to="/app" end className={navLinkClass}>
          <span>Applications</span>
        </NavLink>

        {user?.system_role === 'APPLICANT' && (
          <>
            <NavLink to="/app/applications/new" className={navLinkClass}>
              <span>New Application</span>
            </NavLink>
          </>
        )}

        {user?.system_role === 'ADMIN' && (
          <>
            <NavLink to="/app/admin/users" className={navLinkClass}>
              <span>User Management</span>
            </NavLink>
            <NavLink to="/app/admin/application-types" className={navLinkClass}>
              <span>Application Types</span>
            </NavLink>
            <NavLink to="/app/admin/audit-logs" className={navLinkClass}>
              <span>Audit Logs</span>
            </NavLink>
          </>
        )}
      </nav>

      {/* User info + logout */}
      <div className="p-4 border-t border-gray-100">
        <div className="mb-3">
          <p className="text-sm font-medium text-gray-800 truncate">{user?.full_name}</p>
          <p className="text-xs text-gray-400 truncate">{user?.email}</p>
          <span className="inline-block mt-1 text-xs bg-brand-secondary/60 text-brand-base px-2 py-0.5 rounded-full font-medium">
            {user?.system_role}
          </span>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="w-full text-left text-sm text-red-500 hover:text-red-700 font-medium py-1"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
