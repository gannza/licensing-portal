import type { WorkflowState, TimelineEntry } from '../../types';

interface Props {
  states: WorkflowState[];
  currentState: string;
  timeline: TimelineEntry[];
}

export default function WorkflowProgress({ states, currentState, timeline }: Props) {
  const completedStates = new Set(
    timeline
      .filter(e => e.type === 'STATE_TRANSITION' && e.from_state)
      .map(e => e.from_state!)
  );

  const sorted = [...states].sort((a, b) => a.display_order - b.display_order);

  return (
    <div className="card h-fit">
      <h3 className="text-lg font-semibold text-brand-base mb-4">Workflow</h3>
      <div className="relative pl-6">
        <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-gray-100" />
        <div className="space-y-3">
          {sorted.map((state) => {
            const isDone = completedStates.has(state.key) || (state.key === currentState && state.is_terminal);
            const isCurrent = state.key === currentState && !state.is_terminal;

            return (
              <div key={state.id} className="relative flex items-center gap-3">
                <div className={`absolute -left-4 w-4 h-4 rounded-full border-2 border-white shadow-sm flex items-center justify-center ${
                  isDone ? 'bg-green-400' : isCurrent ? 'bg-brand-primary' : 'bg-gray-200'
                }`}>
                  {isDone && (
                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <div className={`flex-1 rounded-lg px-3 py-2 ${
                  isDone ? 'bg-green-50' : isCurrent ? 'bg-blue-50 ring-1 ring-blue-200' : 'bg-gray-50'
                }`}>
                  <p className={`text-sm font-medium ${
                    isDone ? 'text-green-700' : isCurrent ? 'text-blue-700' : 'text-gray-400'
                  }`}>
                    {state.label}
                  </p>
                  {isDone && (
                    <p className="text-xs text-green-500 mt-0.5">Done</p>
                  )}
                  {isCurrent && (
                    <p className="text-xs text-blue-500 mt-0.5">In progress</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
