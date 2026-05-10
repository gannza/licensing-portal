import { baseApi } from './baseApi';
import type { ApplicationType, DocumentRequirement } from '../types';

interface CreateApplicationTypeRequest {
  name: string;
  code: string;
  description?: string;
  is_active?: boolean;
}

interface UpdateApplicationTypeRequest {
  id: string;
  name?: string;
  code?: string;
  description?: string;
  is_active?: boolean;
}

interface CreateDocumentRequirementRequest {
  application_type_id: string;
  key: string;
  label: string;
  description?: string;
  is_required: boolean;
  allowed_mime_types?: string[];
  max_size_bytes: number;
  display_order: number;
}

interface UpdateDocumentRequirementRequest {
  id: string;
  application_type_id: string;
  key?: string;
  label?: string;
  description?: string;
  is_required?: boolean;
  allowed_mime_types?: string[];
  max_size_bytes?: number;
  display_order?: number;
}

export const applicationTypesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getApplicationTypes: builder.query<{ success: boolean; data: ApplicationType[] }, void>({
      query: () => '/application-types',
      providesTags: ['ApplicationType'],
    }),
    getAdminApplicationTypes: builder.query<{ success: boolean; data: ApplicationType[] }, void>({
      query: () => '/application-types',
      providesTags: ['ApplicationType'],
    }),
    getAdminApplicationType: builder.query<{ success: boolean; data: ApplicationType }, string>({
      query: (id) => `/application-types/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'ApplicationType', id }],
    }),
    createApplicationType: builder.mutation<{ success: boolean; data: ApplicationType }, CreateApplicationTypeRequest>({
      query: (body) => ({ url: '/application-types', method: 'POST', body }),
      invalidatesTags: ['ApplicationType'],
    }),
    updateApplicationType: builder.mutation<{ success: boolean; data: ApplicationType }, UpdateApplicationTypeRequest>({
      query: ({ id, ...body }) => ({ url: `/application-types/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['ApplicationType'],
    }),
    deleteApplicationType: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({ url: `/application-types/${id}`, method: 'DELETE' }),
      invalidatesTags: ['ApplicationType'],
    }),
    createDocumentRequirement: builder.mutation<{ success: boolean; data: DocumentRequirement }, CreateDocumentRequirementRequest>({
      query: ({ application_type_id, ...body }) => ({
        url: `/application-types/${application_type_id}/document-requirements`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_r, _e, { application_type_id }) => [{ type: 'ApplicationType', id: application_type_id }, 'ApplicationType'],
    }),
    updateDocumentRequirement: builder.mutation<{ success: boolean; data: DocumentRequirement }, UpdateDocumentRequirementRequest>({
      query: ({ id, application_type_id: _t, ...body }) => ({ url: `/document-requirements/${id}`, method: 'PATCH', body }),
      invalidatesTags: (_r, _e, { application_type_id }) => [{ type: 'ApplicationType', id: application_type_id }, 'ApplicationType'],
    }),
    deleteDocumentRequirement: builder.mutation<{ success: boolean }, { id: string; application_type_id: string }>({
      query: ({ id }) => ({ url: `/document-requirements/${id}`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, { application_type_id }) => [{ type: 'ApplicationType', id: application_type_id }, 'ApplicationType'],
    }),
  }),
});

export const {
  useGetApplicationTypesQuery,
  useGetAdminApplicationTypesQuery,
  useGetAdminApplicationTypeQuery,
  useCreateApplicationTypeMutation,
  useUpdateApplicationTypeMutation,
  useDeleteApplicationTypeMutation,
  useCreateDocumentRequirementMutation,
  useUpdateDocumentRequirementMutation,
  useDeleteDocumentRequirementMutation,
} = applicationTypesApi;
