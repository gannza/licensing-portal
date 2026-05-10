import { baseApi } from './baseApi';
import type { User, Workflow, WorkflowState, WorkflowTransition, Application, Pagination } from '../types';

interface CreateUserRequest {
  email: string;
  full_name: string;
  phone?: string;
  workflow_roles: { workflow_id: string; role: string }[];
}

interface CreateWorkflowRequest {
  application_type_id: string;
  name: string;
  description?: string;
}

interface UpdateWorkflowRequest {
  id: string;
  name?: string;
  description?: string;
}

interface CreateWorkflowStateRequest {
  workflow_id: string;
  key: string;
  label: string;
  description?: string;
  is_terminal: boolean;
  is_initial: boolean;
  display_order: number;
}

interface UpdateWorkflowStateRequest {
  id: string;
  workflow_id: string;
  key?: string;
  label?: string;
  description?: string;
  is_terminal?: boolean;
  is_initial?: boolean;
  display_order?: number;
}

interface CreateWorkflowTransitionRequest {
  workflow_id: string;
  from_state_key: string;
  to_state_key: string;
  required_role: string;
  requires_decision: boolean;
  label?: string;
}

interface UpdateWorkflowTransitionRequest {
  id: string;
  workflow_id: string;
  from_state_key?: string;
  to_state_key?: string;
  required_role?: string;
  requires_decision?: boolean;
  label?: string;
}

export const adminApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getUsers: builder.query<{ success: boolean; data: User[]; pagination: Pagination }, { page?: number; limit?: number }>({
      query: ({ page = 1, limit = 20 } = {}) => `/users?page=${page}&limit=${limit}`,
      providesTags: ['User'],
    }),
    getUser: builder.query<{ success: boolean; data: User & { workflow_roles: any[] } }, string>({
      query: (id) => `/users/workflow-roles/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'User', id }],
    }),
    createUser: builder.mutation<{ success: boolean; data: { user: User; temp_password: string } }, CreateUserRequest>({
      query: (body) => ({ url: '/users', method: 'POST', body }),
      invalidatesTags: ['User'],
    }),
    updateUserStatus: builder.mutation<{ success: boolean; data: User }, { id: string; is_active: boolean }>({
      query: ({ id, is_active }) => ({ url: `/users/${id}/status`, method: 'PATCH', body: { is_active } }),
      invalidatesTags: ['User'],
    }),
    // Workflows
    getWorkflows: builder.query<{ success: boolean; data: Workflow[] }, void>({
      query: () => '/workflows',
      providesTags: ['Workflow'],
    }),
    getWorkflowsByType: builder.query<{ success: boolean; data: Workflow[] }, string>({
      query: (typeId) => `/workflows?application_type_id=${typeId}`,
      providesTags: ['Workflow'],
    }),
    createWorkflow: builder.mutation<{ success: boolean; data: Workflow }, CreateWorkflowRequest>({
      query: (body) => ({ url: '/workflows', method: 'POST', body }),
      invalidatesTags: ['Workflow'],
    }),
    updateWorkflow: builder.mutation<{ success: boolean; data: Workflow }, UpdateWorkflowRequest>({
      query: ({ id, ...body }) => ({ url: `/workflows/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Workflow'],
    }),
    deleteWorkflow: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({ url: `/workflows/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Workflow'],
    }),
    // Workflow States
    getWorkflowStates: builder.query<{ success: boolean; data: WorkflowState[] }, string>({
      query: (workflowId) => `/workflows/${workflowId}/states`,
      providesTags: (_r, _e, workflowId) => [{ type: 'WorkflowState', id: workflowId }],
    }),
    createWorkflowState: builder.mutation<{ success: boolean; data: WorkflowState }, CreateWorkflowStateRequest>({
      query: ({ workflow_id, ...body }) => ({ url: `/workflows/${workflow_id}/states`, method: 'POST', body }),
      invalidatesTags: (_r, _e, { workflow_id }) => [{ type: 'WorkflowState', id: workflow_id }],
    }),
    updateWorkflowState: builder.mutation<{ success: boolean; data: WorkflowState }, UpdateWorkflowStateRequest>({
      query: ({ id, workflow_id: _w, ...body }) => ({ url: `/workflow-states/${id}`, method: 'PATCH', body }),
      invalidatesTags: (_r, _e, { workflow_id }) => [{ type: 'WorkflowState', id: workflow_id }],
    }),
    deleteWorkflowState: builder.mutation<{ success: boolean }, { id: string; workflow_id: string }>({
      query: ({ id }) => ({ url: `/workflow-states/${id}`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, { workflow_id }) => [{ type: 'WorkflowState', id: workflow_id }],
    }),
    // Workflow Transitions
    getWorkflowTransitions: builder.query<{ success: boolean; data: WorkflowTransition[] }, string>({
      query: (workflowId) => `/workflows/${workflowId}/transitions`,
      providesTags: (_r, _e, workflowId) => [{ type: 'WorkflowTransition', id: workflowId }],
    }),
    createWorkflowTransition: builder.mutation<{ success: boolean; data: WorkflowTransition }, CreateWorkflowTransitionRequest>({
      query: ({ workflow_id, ...body }) => ({ url: `/workflows/${workflow_id}/transitions`, method: 'POST', body }),
      invalidatesTags: (_r, _e, { workflow_id }) => [{ type: 'WorkflowTransition', id: workflow_id }],
    }),
    updateWorkflowTransition: builder.mutation<{ success: boolean; data: WorkflowTransition }, UpdateWorkflowTransitionRequest>({
      query: ({ id, workflow_id: _w, ...body }) => ({ url: `/workflow-transitions/${id}`, method: 'PATCH', body }),
      invalidatesTags: (_r, _e, { workflow_id }) => [{ type: 'WorkflowTransition', id: workflow_id }],
    }),
    deleteWorkflowTransition: builder.mutation<{ success: boolean }, { id: string; workflow_id: string }>({
      query: ({ id }) => ({ url: `/workflow-transitions/${id}`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, { workflow_id }) => [{ type: 'WorkflowTransition', id: workflow_id }],
    }),
    // Applications & Audit
    getAdminApplications: builder.query<{ success: boolean; data: Application[]; pagination: Pagination }, { page?: number; state?: string }>({
      query: ({ page = 1, state } = {}) => `/applications?page=${page}${state ? `&state=${state}` : ''}`,
      providesTags: ['Application'],
    }),
    getAuditLogs: builder.query<{ success: boolean; data: any[]; pagination: Pagination }, { page?: number }>({
      query: ({ page = 1 } = {}) => `/audit-logs?page=${page}`,
      providesTags: ['AuditLog'],
    }),
  }),
});

export const {
  useGetUsersQuery,
  useGetUserQuery,
  useCreateUserMutation,
  useUpdateUserStatusMutation,
  useGetWorkflowsQuery,
  useGetWorkflowsByTypeQuery,
  useCreateWorkflowMutation,
  useUpdateWorkflowMutation,
  useDeleteWorkflowMutation,
  useGetWorkflowStatesQuery,
  useCreateWorkflowStateMutation,
  useUpdateWorkflowStateMutation,
  useDeleteWorkflowStateMutation,
  useGetWorkflowTransitionsQuery,
  useCreateWorkflowTransitionMutation,
  useUpdateWorkflowTransitionMutation,
  useDeleteWorkflowTransitionMutation,
  useGetAdminApplicationsQuery,
  useGetAuditLogsQuery,
} = adminApi;
