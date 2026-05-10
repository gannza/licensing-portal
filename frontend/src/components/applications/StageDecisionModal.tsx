import { useState } from 'react';
import type { WorkflowTransition, DecisionType } from '../../types';
import { convertToUpperCase } from '../../api/utils';

interface Props {
  transition: WorkflowTransition;
  currentState: string;
  onConfirm: (decisionType: DecisionType, decisionNote: string) => void;
  onCancel: () => void;
  isLoading: boolean;
}

export default function StageDecisionModal({ transition, currentState, onConfirm, onCancel, isLoading }: Props) {
  const [decisionType, setDecisionType] = useState<DecisionType>('APPROVED_STAGE');
  const [decisionNote, setDecisionNote] = useState('');

  const needsDecision = transition.requires_decision;
  const isApproval = convertToUpperCase(transition.to_state_key).includes('APPROVE');
  const isRejection = convertToUpperCase(transition.to_state_key).includes('REJECT');
  const isSubmitted = currentState === 'SUBMITTED';
// console.log('Transition requires decision:', needsDecision, 'isApproval:', isApproval, 'isRejection:', isRejection, 'currentState:', currentState);
  const decisionTypes: DecisionType[] = isSubmitted
    ? ['APPROVED_STAGE', 'REQUEST_INFO']
    : ['APPROVED_STAGE'];

  const handleSubmit = () => {
    if (needsDecision && !decisionNote.trim()) return;
    onConfirm(isRejection ? 'APPROVED_STAGE' : decisionType, decisionNote);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-bold text-brand-base">{transition.label || transition.to_state_key}</h3>
          <p className="text-sm text-gray-500 mt-1">
            Transitioning to: <strong>{transition.to_state_key.replace(/_/g, ' ')}</strong>
          </p>
        </div>

        <div className="p-6 space-y-4">
          {needsDecision && !isRejection && !isApproval && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Decision Type</label>
              <div className="flex gap-2">
                {decisionTypes.map(dt => (
                  <button
                    key={dt}
                    type="button"
                    onClick={() => setDecisionType(dt)}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium border transition-all ${
                      decisionType === dt
                        ? 'bg-brand-primary border-brand-primary text-brand-base'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {dt.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            </div>
          )}

          {needsDecision && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Decision Note <span className="text-red-500">*</span>
              </label>
              <textarea
                className="input-field min-h-32 resize-none"
                value={decisionNote}
                onChange={e => setDecisionNote(e.target.value)}
                placeholder={
                  isApproval ? 'Provide your approval rationale...' :
                  isRejection ? 'Provide your rejection reason...' :
                  'Document your decision and any requirements...'
                }
                rows={5}
              />
              <p className="text-xs text-gray-400 mt-1">
                This note will be visible to the applicant.
              </p>
            </div>
          )}

          {!needsDecision && (
            <p className="text-sm text-gray-600">
              Confirm that you want to proceed with this action.
            </p>
          )}
        </div>

        <div className="p-6 border-t border-gray-100 flex gap-3">
          <button onClick={onCancel} className="btn-secondary flex-1">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={isLoading || (needsDecision && !decisionNote.trim())}
            className={`flex-1 ${isRejection ? 'btn-danger' : 'btn-primary'}`}
          >
            {isLoading ? 'Processing...' : `Confirm: ${transition.label || transition.to_state_key}`}
          </button>
        </div>
      </div>
    </div>
  );
}
