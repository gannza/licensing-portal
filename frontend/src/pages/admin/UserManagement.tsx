import { Link } from 'react-router-dom';
import { useGetUsersQuery, useUpdateUserStatusMutation } from '../../api/adminApi';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import type { User } from '../../types';

export default function UserManagement() {
  const { data, isLoading } = useGetUsersQuery({});
  const [updateStatus] = useUpdateUserStatusMutation();

  const handleToggleStatus = async (user: User) => {
    const next = !user.is_active;
    try {
      await updateStatus({ id: user.id, is_active: next }).unwrap();
      toast.success(`User ${next ? 'activated' : 'deactivated'}`);
    } catch {
      toast.error('Failed to update user status');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="card flex-1">
          <h2 className="text-xl font-bold text-brand-base">User Management</h2>
          <p className="text-gray-500 text-sm mt-1">
            Manage BNR staff accounts and workflow role assignments.
          </p>
        </div>
        <Link to="/app/admin/users/new" className="btn-primary whitespace-nowrap">
          + Create Staff User
        </Link>
      </div>

      <div className="card">
        {isLoading && <LoadingSpinner />}
        {data?.data && (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100">
                <th className="pb-3 font-medium">Name</th>
                <th className="pb-3 font-medium">Email</th>
                <th className="pb-3 font-medium">Role</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.data.map(user => (
                <tr key={user.id}>
                  <td className="py-3 font-medium text-gray-800">{user.full_name}</td>
                  <td className="py-3 text-gray-600">{user.email}</td>
                  <td className="py-3">
                    <span className="text-xs bg-brand-secondary/60 text-brand-base px-2 py-0.5 rounded-full font-medium">
                      {user.system_role}
                    </span>
                  </td>
                  <td className="py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                    }`}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(user)}
                      className="text-xs text-brand-special hover:underline"
                    >
                      {user.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
