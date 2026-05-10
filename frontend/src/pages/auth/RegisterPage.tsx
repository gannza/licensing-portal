import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import { useRegisterMutation } from '../../api/authApi';
import { getApiErrorMessage } from '../../utils/apiError';
import { setCredentials } from '../../slices/authSlice';

export default function RegisterPage() {
  const [form, setForm] = useState({
    email: '', password: '', full_name: '', phone: '',
    institution_name: '', institution_registration_number: '',
  });
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [register, { isLoading }] = useRegisterMutation();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await register(form).unwrap();
      dispatch(setCredentials({ user: res.data.user }));
      toast.success('Registration successful!');
      navigate('/app');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Registration failed'));
    }
  };

  const fields: { name: keyof typeof form; label: string; type?: string; placeholder?: string }[] = [
    { name: 'full_name', label: 'Your Full Name', placeholder: 'Jane Doe' },
    { name: 'email', label: 'Email Address', type: 'email', placeholder: 'jane@example.com' },
    { name: 'password', label: 'Password', type: 'password', placeholder: 'Min 8 chars, 1 uppercase, 1 number' },
    { name: 'phone', label: 'Phone Number', placeholder: '+250780000000' },
    { name: 'institution_name', label: 'Institution Name', placeholder: 'Rwanda Financial Services Ltd' },
    { name: 'institution_registration_number', label: 'Registration Number', placeholder: 'RDB/2024/001234' },
  ];
const companyName = import.meta.env.VITE_APP_COMPANY_NAME || 'National Bank of Rwanda';
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-base via-amber-900 to-brand-base flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-brand-base">Register Institution</h1>
            <p className="text-gray-500 text-sm mt-1">Apply for a banking license with {companyName}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {fields.map(({ name, label, type = 'text', placeholder }) => (
              <div key={name}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                <input
                  type={type}
                  name={name}
                  className="input-field"
                  value={form[name]}
                  onChange={handleChange}
                  required={name !== 'phone'}
                  placeholder={placeholder}
                />
              </div>
            ))}

            <button type="submit" disabled={isLoading} className="btn-primary w-full py-2.5 mt-2">
              {isLoading ? 'Creating account...' : 'Create Account & Continue'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-5">
            Already registered?{' '}
            <Link to="/login" className="text-brand-special font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
