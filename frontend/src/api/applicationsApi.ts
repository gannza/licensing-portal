import { baseApi } from './baseApi';
import type { Application, TimelineEntry, WorkflowState, StageDecision, Pagination } from '../types';

interface TransitionRequest {
  toState: string;
  decisionType?: 'APPROVED_STAGE' | 'REQUEST_INFO' | 'ESCALATED';
  decisionNote?: string;
}

export const applicationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getApplications: builder.query<{ success: boolean; data: Application[]; pagination: Pagination }, { page?: number; limit?: number }>({
      query: ({ page = 1, limit = 20 } = {}) => `/applications?page=${page}&limit=${limit}`,
      providesTags: ['Application'],
    }),
    getApplication: builder.query<{ success: boolean; data: Application }, string>({
      query: (id) => `/applications/${id}`,
      providesTags: (_result, _err, id) => [{ type: 'Application', id }],
    }),
    createApplication: builder.mutation<{ success: boolean; data: Application }, { application_type_id: string }>({
      query: (body) => ({ url: '/applications', method: 'POST', body }),
      invalidatesTags: ['Application'],
    }),
    performTransition: builder.mutation<{ success: boolean; data: { application: Application; stage_decision: StageDecision | null } }, { id: string } & TransitionRequest>({
      query: ({ id, ...body }) => ({ url: `/applications/${id}/stage-decision`, method: 'POST', body }),
      invalidatesTags: (_result, _err, { id }) => [{ type: 'Application', id }, 'Application'],
    }),
    getTimeline: builder.query<{ success: boolean; data: { timeline: TimelineEntry[]; workflow_states: WorkflowState[] } }, string>({
      query: (id) => `/applications/${id}/timeline`,
      providesTags: (_result, _err, id) => [{ type: 'Application', id }],
    }),
    getStageDecisions: builder.query<{ success: boolean; data: StageDecision[] }, string>({
      query: (id) => `/applications/${id}/stage-decisions`,
      providesTags: (_result, _err, id) => [{ type: 'Application', id }],
    }),
  }),
});

export const {
  useGetApplicationsQuery,
  useGetApplicationQuery,
  useCreateApplicationMutation,
  usePerformTransitionMutation,
  useGetTimelineQuery,
  useGetStageDecisionsQuery,
} = applicationsApi;
