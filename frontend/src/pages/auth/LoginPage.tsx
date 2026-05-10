import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import { useLoginMutation } from '../../api/authApi';
import { getApiErrorMessage } from '../../utils/apiError';
import { setCredentials, setMustChangePassword } from '../../slices/authSlice';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [login, { isLoading }] = useLoginMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await login({ email, password }).unwrap();
      if (res.data.must_change_password) {
        dispatch(setMustChangePassword({ user_id: res.data.user_id! }));
        navigate('/change-password');
        return;
      }
      dispatch(setCredentials({ user: res.data.user! }));
      navigate('/app');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Login failed'));
    }
  };
    const appName = import.meta.env.VITE_APP_NAME || 'Licensing System';
    const companyName = import.meta.env.VITE_APP_COMPANY_NAME || 'National Bank of Rwanda';

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-base via-amber-900 to-brand-base flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
           
            <h1 className="text-2xl font-bold text-brand-base">{appName}</h1>
            <p className="text-gray-500 mt-1 text-sm">{companyName}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
              <input
                type="email"
                className="input-field"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                className="input-field"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder=".........."
              />
            </div>

            <button type="submit" disabled={isLoading} className="btn-primary w-full py-2.5">
              {isLoading ? 'Signing in....' : 'Sign in'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            New applicant?{' '}
            <Link to="/register" className="text-brand-special font-medium hover:underline">
              Register your institution
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
