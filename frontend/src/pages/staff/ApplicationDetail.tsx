import { useParams } from 'react-router-dom';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useGetApplicationQuery, usePerformTransitionMutation, useGetTimelineQuery } from '../../api/applicationsApi';
import { useGetDocumentsQuery } from '../../api/documentsApi';
import StatusBadge from '../../components/common/StatusBadge';
import Timeline from '../../components/applications/Timeline';
import WorkflowProgress from '../../components/applications/WorkflowProgress';
import StageDecisionModal from '../../components/applications/StageDecisionModal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import type { WorkflowTransition, DecisionType } from '../../types';
import { getApiErrorMessage } from '../../utils/apiError';
import { convertToUpperCase } from '../../api/utils';

export default function ApplicationDetailStaff() {
  const { id } = useParams<{ id: string }>();
  const { data: appData, isLoading } = useGetApplicationQuery(id!);
  const { data: docsData } = useGetDocumentsQuery({ applicationId: id! });
  const { data: timelineData } = useGetTimelineQuery(id!);
  const [performTransition, { isLoading: transitioning }] = usePerformTransitionMutation();
  const [selectedTransition, setSelectedTransition] = useState<WorkflowTransition | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  if (isLoading) return <LoadingSpinner />;
  const app = appData?.data;
  if (!app) return <p className="text-red-500">Application not found.</p>;

  const handleTransitionClick = (transition: WorkflowTransition) => {
    setSelectedTransition(transition);
    setModalOpen(true);
  };

  const handleTransitionConfirm = async (decisionType: DecisionType, decisionNote: string) => {
    if (!selectedTransition) return;
    try {
      await performTransition({
        id: id!,
        toState: selectedTransition.to_state_key,
        decisionType,
        decisionNote,
      }).unwrap();
      toast.success('Transition completed successfully');
      setModalOpen(false);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Transition failed'));
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="card">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-brand-base">{app.type_name}</h2>
            <p className="text-sm text-gray-500 mt-1">
              Applicant: <strong>{app.applicant_name}</strong> ({app.applicant_email})
            </p>
            <p className="text-sm text-gray-500">Submission Cycle: {app.current_submission_cycle}</p>
          </div>
          <StatusBadge state={app.current_state} />
        </div>

        {app.available_transitions && app.available_transitions.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-sm font-medium text-gray-600 mb-3">Available Actions</p>
            <div className="flex flex-wrap gap-2">
              {app.available_transitions.map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleTransitionClick(t)}
                  disabled={transitioning}
                  className={`btn-primary text-sm py-1.5 px-4 ${
                    convertToUpperCase(t.to_state_key).includes('REJECT') ? 'bg-red-100 text-red-700 hover:bg-red-200' :
                    convertToUpperCase(t.to_state_key) === 'APPROVED' ? 'bg-green-100 text-green-700 hover:bg-green-200' : ''
                  }`}
                >
                  {t.label || t.to_state_key}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {docsData?.data && docsData.data.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-brand-base mb-4">Submitted Documents</h3>
          <div className="space-y-2">
            {docsData.data.map(doc => (
              <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-800">{doc.requirement_key}</p>
                  <p className="text-xs text-gray-400">{doc.file_name} &middot; {(doc.file_size / 1024).toFixed(1)} KB</p>
                </div>
                <a
                  href={`/${doc.storage_path.replace(/\\/g, '/')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary text-xs py-1.5 px-3"
                >
                  View
                </a>
              </div>
            ))}
          </div>
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

      {modalOpen && selectedTransition && (
        <StageDecisionModal
          transition={selectedTransition}
          currentState={app.current_state}
          onConfirm={handleTransitionConfirm}
          onCancel={() => setModalOpen(false)}
          isLoading={transitioning}
        />
      )}
    </div>
  );
}
