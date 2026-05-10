import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { User } from '../types';

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  must_change_password: boolean;
  pending_user_id: string | null;
}

export const initialAuthState: AuthState = {
  user: null,
  isAuthenticated: false,
  must_change_password: false,
  pending_user_id: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState: initialAuthState,
  reducers: {
    setCredentials(state, action: PayloadAction<{ user: User }>) {
      state.user = action.payload.user;
      state.isAuthenticated = true;
      state.must_change_password = false;
      state.pending_user_id = null;
    },
    setMustChangePassword(state, action: PayloadAction<{ user_id: string }>) {
      state.must_change_password = true;
      state.pending_user_id = action.payload.user_id;
      state.isAuthenticated = false;
    },
    logout(state) {
      state.user = null;
      state.isAuthenticated = false;
      state.must_change_password = false;
      state.pending_user_id = null;
    },
  },
});

export const { setCredentials, setMustChangePassword, logout } = authSlice.actions;
export default authSlice.reducer;
