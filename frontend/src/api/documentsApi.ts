import { baseApi } from './baseApi';
import type { ApplicationDocument } from '../types';

export const documentsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    uploadDocument: builder.mutation<{ success: boolean; data: ApplicationDocument }, { applicationId: string; requirementKey: string; file: File }>({
      query: ({ applicationId, requirementKey, file }) => {
        const formData = new FormData();
        formData.append('file', file);
        return {
          url: `/applications/${applicationId}/documents/${requirementKey}`,
          method: 'POST',
          body: formData,
        };
      },
      invalidatesTags: (_result, _err, { applicationId }) => [{ type: 'Application', id: applicationId }, 'Document'],
    }),
    getDocuments: builder.query<{ success: boolean; data: ApplicationDocument[] }, { applicationId: string; cycle?: number }>({
      query: ({ applicationId, cycle }) => `/applications/${applicationId}/documents${cycle ? `?cycle=${cycle}` : ''}`,
      providesTags: ['Document'],
    }),
    getDocumentHistory: builder.query<{ success: boolean; data: ApplicationDocument[] }, { applicationId: string; requirementKey: string }>({
      query: ({ applicationId, requirementKey }) => `/applications/${applicationId}/documents/${requirementKey}/history`,
      providesTags: ['Document'],
    }),
  }),
});

export const {
  useUploadDocumentMutation,
  useGetDocumentsQuery,
  useGetDocumentHistoryQuery,
} = documentsApi;
