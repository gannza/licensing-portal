import { useSelector } from 'react-redux';
import type { RootState } from '../store';

export function useAuth() {
  return useSelector((state: RootState) => state.auth);
}
