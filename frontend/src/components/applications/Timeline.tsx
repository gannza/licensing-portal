import type { TimelineEntry } from '../../types';

interface Props { entries: TimelineEntry[] }

const decisionTypeLabel: Record<string, string> = {
  APPROVED_STAGE: 'Approved Stage',
  REQUEST_INFO: 'Requested Information'
};

const decisionTypeColor: Record<string, string> = {
  APPROVED_STAGE: 'bg-green-100 text-green-700',
  REQUEST_INFO: 'bg-orange-100 text-orange-700'
};

export default function Timeline({ entries }: Props) {
  const meaningful = entries.filter(e =>
    e.type === 'STAGE_DECISION' || (e.from_state && e.to_state)
  );

  if (meaningful.length === 0) {
    return <p className="text-gray-400 text-sm text-center py-6">No timeline entries yet.</p>;
  }

  return (
    <div className="relative pl-6">
      <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-gray-100" />

      <div className="space-y-6">
        {meaningful.map((entry, idx) => (
          <div key={idx} className="relative">
            <div className={`absolute -left-4 w-4 h-4 rounded-full border-2 border-white shadow-sm ${
              entry.type === 'STAGE_DECISION'
                ? entry.decision_type === 'APPROVED_STAGE' ? 'bg-green-400'
                  : entry.decision_type === 'REQUEST_INFO' ? 'bg-orange-400'
                  : 'bg-purple-400'
                : 'bg-brand-primary'
            }`} />

            <div className="bg-gray-50 rounded-xl p-4">
              {entry.type === 'STATE_TRANSITION' ? (
                <div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-800">
                      {entry.from_state?.replace(/_/g, ' ')} &rarr; {entry.to_state?.replace(/_/g, ' ')}
                    </p>
                    <span className="text-xs text-gray-400">{new Date(entry.created_at).toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">by {entry.actor?.full_name}</p>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-800">
                        {entry.stage?.replace(/_/g, ' ')} Decision
                      </p>
                      {entry.decision_type && (
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${decisionTypeColor[entry.decision_type] || 'bg-gray-100 text-gray-600'}`}>
                          {decisionTypeLabel[entry.decision_type] || entry.decision_type}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-400">{new Date(entry.created_at).toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">by {entry.reviewer?.full_name}</p>
                  {entry.decision_note && (
                    <div className="mt-3 p-3 bg-white rounded-lg border border-gray-100">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{entry.decision_note}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
