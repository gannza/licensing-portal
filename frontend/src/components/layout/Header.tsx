import { useAuth } from '../../hooks/useAuth';

export default function Header() {
  const { user } = useAuth();
  return (
    <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between shadow-sm">
      <h1 className="text-lg font-semibold text-brand-base">
        {/* National Bank of Rwanda . Licensing Portal */}
      </h1>
      <span className="text-sm text-gray-500">Welcome, {user?.full_name}</span>
    </header>
  );
}
