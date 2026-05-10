interface Props { state: string }

const stateConfig: Record<string, { label: string; className: string }> = {
  DRAFT: { label: 'Draft', className: 'bg-gray-100 text-gray-600' },
  SUBMITTED: { label: 'Submitted', className: 'bg-blue-100 text-blue-700' },
  UNDER_INITIAL_REVIEW: { label: 'Initial Review', className: 'bg-amber-100 text-amber-700' },
  UNDER_REVIEW: { label: 'Under Review', className: 'bg-amber-100 text-amber-700' },
  PENDING_INFORMATION: { label: 'Info Requested', className: 'bg-orange-100 text-orange-700' },
  UNDER_LEGAL_REVIEW: { label: 'Legal Review', className: 'bg-purple-100 text-purple-700' },
  UNDER_FINANCIAL_REVIEW: { label: 'Financial Review', className: 'bg-indigo-100 text-indigo-700' },
  PENDING_APPROVAL: { label: 'Pending Approval', className: 'bg-brand-secondary text-brand-base' },
  APPROVED: { label: 'Approved', className: 'bg-green-100 text-green-700' },
  REJECTED: { label: 'Rejected', className: 'bg-red-100 text-red-700' },
};

export default function StatusBadge({ state }: Props) {
  const config = stateConfig[state] || { label: state, className: 'bg-gray-100 text-gray-600' };
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${config.className}`}>
      {config.label}
    </span>
  );
}
