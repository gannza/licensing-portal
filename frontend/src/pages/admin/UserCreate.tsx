import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useCreateUserMutation, useGetWorkflowsQuery } from '../../api/adminApi';

const WORKFLOW_ROLES = ['INTAKE_OFFICER', 'REVIEWER', 'LEGAL_OFFICER', 'FINANCIAL_OFFICER', 'APPROVER'];

export default function UserCreate() {
  const navigate = useNavigate();
  const [createUser, { isLoading }] = useCreateUserMutation();
  const { data: workflowsData } = useGetWorkflowsQuery();
  const [form, setForm] = useState({ email: '', full_name: '', phone: '' });
  const [roleAssignments, setRoleAssignments] = useState<{ workflow_id: string; role: string }[]>([]);
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  const addRoleAssignment = () => {
    setRoleAssignments(r => [...r, { workflow_id: '', role: '' }]);
  };

  const removeRoleAssignment = (idx: number) => {
    setRoleAssignments(r => r.filter((_, i) => i !== idx));
  };

  const updateRoleAssignment = (idx: number, field: string, value: string) => {
    setRoleAssignments(r => r.map((ra, i) => i === idx ? { ...ra, [field]: value } : ra));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validRoles = roleAssignments.filter(r => r.workflow_id && r.role);
    try {
      const res = await createUser({ ...form, workflow_roles: validRoles }).unwrap();
      setTempPassword(res.data.temp_password);
      toast.success('User created successfully');
    } catch (err: any) {
      toast.error(err?.data?.error?.message || 'Failed to create user');
    }
  };

  if (tempPassword) {
    return (
      <div className="max-w-md mx-auto">
        <div className="card border-2 border-green-200 bg-green-50">
          <h2 className="text-xl font-bold text-green-800 mb-2">User Created</h2>
          <p className="text-sm text-green-700 mb-4">
            Share the temporary password below with the new staff member. They will be asked to change it on first login.
          </p>
          <div className="bg-white rounded-lg p-4 border border-green-200">
            <p className="text-xs text-gray-500 mb-1">Temporary Password</p>
            <p className="font-mono text-lg font-bold text-brand-base tracking-wider">{tempPassword}</p>
          </div>
          <button onClick={() => navigate('/app/admin/users')} className="btn-primary w-full mt-4">
            Back to Users
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="card">
        <h2 className="text-xl font-bold text-brand-base">Create Staff User</h2>
        <p className="text-gray-500 text-sm mt-1">Create a new BNR staff account and assign workflow roles.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="card space-y-4">
          <h3 className="font-semibold text-gray-700">Account Details</h3>
          {[
            { name: 'full_name', label: 'Full Name', placeholder: 'Alice Uwimana' },
            { name: 'email', label: 'Email Address', type: 'email', placeholder: 'alice@bnr.rw' },
            { name: 'phone', label: 'Phone Number', placeholder: '+250780000000', required: false },
          ].map(({ name, label, type = 'text', placeholder, required = true }) => (
            <div key={name}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <input
                type={type}
                className="input-field"
                value={(form as any)[name]}
                onChange={e => setForm(f => ({ ...f, [name]: e.target.value }))}
                required={required}
                placeholder={placeholder}
              />
            </div>
          ))}
        </div>

        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-700">Workflow Role Assignments</h3>
            <button type="button" onClick={addRoleAssignment} className="btn-secondary text-sm py-1 px-3">
              + Add Role
            </button>
          </div>

          {roleAssignments.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">
              No roles assigned. Click "+ Add Role" to assign workflow roles.
            </p>
          )}

          {roleAssignments.map((ra, idx) => (
            <div key={idx} className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-600 mb-1">Workflow</label>
                <select
                  className="input-field"
                  value={ra.workflow_id}
                  onChange={e => updateRoleAssignment(idx, 'workflow_id', e.target.value)}
                >
                  <option value="">Select workflow...</option>
                  {workflowsData?.data?.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-600 mb-1">Role</label>
                <select
                  className="input-field"
                  value={ra.role}
                  onChange={e => updateRoleAssignment(idx, 'role', e.target.value)}
                >
                  <option value="">Select role...</option>
                  {WORKFLOW_ROLES.map(r => (
                    <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={() => removeRoleAssignment(idx)}
                className="text-red-400 hover:text-red-600 pb-2"
              >
                &#x2715;
              </button>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={() => navigate('/app/admin/users')} className="btn-secondary flex-1">
            Cancel
          </button>
          <button type="submit" disabled={isLoading} className="btn-primary flex-1">
            {isLoading ? 'Creating...' : 'Create User'}
          </button>
        </div>
      </form>
    </div>
  );
}
