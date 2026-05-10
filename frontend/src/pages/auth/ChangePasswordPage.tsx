import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import { useChangePasswordMutation } from '../../api/authApi';
import { setCredentials } from '../../slices/authSlice';

export default function ChangePasswordPage() {
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [changePassword, { isLoading }] = useChangePasswordMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirm) {
      toast.error('Passwords do not match');
      return;
    }
    try {
      const res = await changePassword({ new_password: newPassword }).unwrap();
      dispatch(setCredentials({ user: res.data.user }));
      toast.success('Password changed successfully!');
      navigate('/app');
    } catch (err: any) {
      toast.error(err?.data?.error?.message || 'Failed to change password');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-base via-amber-900 to-brand-base flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-brand-base">Set New Password</h1>
            <p className="text-gray-500 text-sm mt-1">Your account requires a password change before continuing.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <input
                type="password"
                className="input-field"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
                placeholder="Min 8 chars, 1 uppercase, 1 number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
              <input
                type="password"
                className="input-field"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
                placeholder="Repeat new password"
              />
            </div>
            <button type="submit" disabled={isLoading} className="btn-primary w-full py-2.5">
              {isLoading ? 'Updating...' : 'Set New Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
