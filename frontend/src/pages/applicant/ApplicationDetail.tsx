import { useParams } from 'react-router-dom';
import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useGetApplicationQuery, usePerformTransitionMutation, useGetTimelineQuery } from '../../api/applicationsApi';
import { useGetApplicationTypesQuery } from '../../api/applicationTypesApi';
import { useUploadDocumentMutation, useGetDocumentsQuery } from '../../api/documentsApi';
import StatusBadge from '../../components/common/StatusBadge';
import Timeline from '../../components/applications/Timeline';
import WorkflowProgress from '../../components/applications/WorkflowProgress';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { getApiErrorMessage } from '../../utils/apiError';

export default function ApplicationDetailApplicant() {
  const { id } = useParams<{ id: string }>();
  const { data: appData, isLoading } = useGetApplicationQuery(id!);
  const { data: typesData } = useGetApplicationTypesQuery();
  const { data: docsData, refetch: refetchDocs } = useGetDocumentsQuery({ applicationId: id! });
  const { data: timelineData } = useGetTimelineQuery(id!);
  const [uploadDoc] = useUploadDocumentMutation();
  const [performTransition, { isLoading: transitioning }] = usePerformTransitionMutation();
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  if (isLoading) return <LoadingSpinner />;
  const app = appData?.data;
  if (!app) return <p className="text-red-500">Application not found.</p>;

  const appType = typesData?.data?.find(t => t.id === app.application_type_id);
  const canUpload = ['DRAFT', 'PENDING_INFORMATION'].includes(app.current_state);
  const canSubmit = app.current_state === 'DRAFT' || app.current_state === 'PENDING_INFORMATION';
  const submitLabel = app.current_state === 'PENDING_INFORMATION' ? 'Resubmit Application' : 'Submit Application';
  const toState = 'SUBMITTED';

  const handleFileUpload = async (requirementKey: string, file: File) => {
    setUploadingKey(requirementKey);
    try {
      await uploadDoc({ applicationId: id!, requirementKey, file }).unwrap();
      toast.success('Document uploaded successfully');
      refetchDocs();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Upload failed'));
    } finally {
      setUploadingKey(null);
    }
  };

  const handleTransition = async () => {
    try {
      await performTransition({ id: id!, toState, decisionNote:'Application Submitted' }).unwrap();
      toast.success(app.current_state === 'PENDING_INFORMATION' ? 'Application resubmitted!' : 'Application submitted!');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Submission failed'));
    }
  };

  const uploadedDocs = docsData?.data || [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="card">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-brand-base">{app.type_name}</h2>
            <p className="text-sm text-gray-500 mt-1">Submission Cycle {app.current_submission_cycle}</p>
          </div>
          <StatusBadge state={app.current_state} />
        </div>
        {app.current_state === 'PENDING_INFORMATION' && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm font-medium text-amber-800">Action Required</p>
            <p className="text-sm text-amber-700 mt-0.5">
              BNR has requested additional information. Please review the feedback below, upload the requested documents, and resubmit.
            </p>
          </div>
        )}
      </div>

      {appType && (
        <div className="card">
          <h3 className="text-lg font-semibold text-brand-base mb-4">Documents</h3>
          <div className="space-y-3">
            {appType.document_requirements.map(req => {
              const uploaded = uploadedDocs.find(d => d.requirement_key === req.key);
              return (
                <div key={req.key} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                      uploaded ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                    }`}>
                      {uploaded ? '✓' : req.is_required ? '!' : '○'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {req.label}
                        {req.is_required && <span className="text-red-500 ml-1">*</span>}
                      </p>
                      {uploaded && (
                        <p className="text-xs text-gray-400">{uploaded.file_name}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {uploaded && (
                      <a
                        href={`/${uploaded.storage_path.replace(/\\/g, '/')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-secondary text-xs py-1.5 px-3"
                      >
                        View
                      </a>
                    )}
                    {canUpload && (
                      <>
                        <input
                          type="file"
                          ref={el => { fileInputRefs.current[req.key] = el; }}
                          className="hidden"
                          aria-label={`Upload ${req.label}`}
                          accept={req.allowed_mime_types?.join(',') || '*'}
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload(req.key, file);
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRefs.current[req.key]?.click()}
                          disabled={uploadingKey === req.key}
                          className="btn-secondary text-xs py-1.5 px-3"
                        >
                          {uploadingKey === req.key ? 'Uploading...' : uploaded ? 'Replace' : 'Upload'}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {canSubmit && (
            <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={handleTransition}
                disabled={transitioning}
                className="btn-primary px-6"
              >
                {transitioning ? 'Submitting...' : submitLabel}
              </button>
            </div>
          )}
        </div>
      )}

      {timelineData?.data?.timeline && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 card">
            <h3 className="text-lg font-semibold text-brand-base mb-4">Application Timeline</h3>
            <Timeline entries={timelineData.data.timeline} />
          </div>
          {timelineData.data.workflow_states?.length > 0 && (
            <WorkflowProgress
              states={timelineData.data.workflow_states}
              currentState={app.current_state}
              timeline={timelineData.data.timeline}
            />
          )}
        </div>
      )}
    </div>
  );
}
