import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useGetMeQuery } from '../../api/authApi';
import { setCredentials } from '../../slices/authSlice';
import LoadingSpinner from '../common/LoadingSpinner';

interface Props { children: React.ReactNode }

export default function RequireAuth({ children }: Props) {
  const { data, isLoading, isError } = useGetMeQuery();
  const dispatch = useDispatch();

  useEffect(() => {
    if (data?.data?.user) {
      dispatch(setCredentials({ user: data.data.user }));
    }
  }, [data, dispatch]);

  if (isLoading) return <LoadingSpinner />;
  if (isError || !data?.data?.user) return <Navigate to="/login" replace />;
  if (data.data.user.must_change_password) return <Navigate to="/change-password" replace />;

  return <>{children}</>;
}
