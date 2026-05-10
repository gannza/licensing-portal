import { baseApi } from './baseApi';
import type { User } from '../types';

interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  institution_name: string;
  institution_registration_number: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

interface AuthResponse {
  user: User;
}

interface LoginResponse {
  user?: User;
  must_change_password?: boolean;
  user_id?: string;
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMe: builder.query<{ success: boolean; data: AuthResponse }, void>({
      query: () => ({ url: '/auth/me', method: 'GET' }),
      providesTags: ['Me'],
    }),
    register: builder.mutation<{ success: boolean; data: AuthResponse }, RegisterRequest>({
      query: (body) => ({ url: '/auth/register', method: 'POST', body }),
    }),
    login: builder.mutation<{ success: boolean; data: LoginResponse }, LoginRequest>({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
      invalidatesTags: ['Me'],
    }),
    logout: builder.mutation<void, void>({
      query: () => ({ url: '/auth/logout', method: 'POST' }),
      invalidatesTags: ['Me'],
    }),
    refreshToken: builder.mutation<{ success: boolean }, void>({
      query: () => ({ url: '/auth/refresh', method: 'POST' }),
    }),
    changePassword: builder.mutation<{ success: boolean; data: AuthResponse }, { current_password?: string; new_password: string }>({
      query: (body) => ({ url: '/auth/change-password', method: 'POST', body }),
      invalidatesTags: ['Me'],
    }),
  }),
});

export const {
  useGetMeQuery,
  useRegisterMutation,
  useLoginMutation,
  useLogoutMutation,
  useRefreshTokenMutation,
  useChangePasswordMutation,
} = authApi;
