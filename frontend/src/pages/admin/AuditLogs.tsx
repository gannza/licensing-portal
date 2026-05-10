import { useState } from 'react';
import { useGetAuditLogsQuery } from '../../api/adminApi';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function AuditLogs() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useGetAuditLogsQuery({ page });

  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="text-xl font-bold text-brand-base">Audit Logs</h2>
        <p className="text-gray-500 text-sm mt-1">Immutable record of all system actions.</p>
      </div>

      <div className="card overflow-x-auto">
        {isLoading && <LoadingSpinner />}
        {data?.data && (
          <>
            <table className="w-full text-sm min-w-max">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100">
                  <th className="pb-3 font-medium">Timestamp</th>
                  <th className="pb-3 font-medium">Actor</th>
                  <th className="pb-3 font-medium">Action</th>
                  <th className="pb-3 font-medium">From &rarr; To</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.data.map((log: any) => (
                  <tr key={log.id}>
                    <td className="py-3 text-xs text-gray-400 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="py-3">
                      <p className="font-medium text-gray-800 text-xs">{log.actor_name}</p>
                      <p className="text-xs text-gray-400">{log.actor_email}</p>
                    </td>
                    <td className="py-3">
                      <span className="text-xs font-mono bg-gray-100 px-1.5 py-0.5 rounded">{log.action}</span>
                    </td>
                    <td className="py-3 text-xs text-gray-600">
                      {log.from_state && log.to_state
                        ? `${log.from_state} -> ${log.to_state}`
                        : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {data.pagination && data.pagination.total > data.pagination.limit && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-500">
                  {data.pagination.total} total entries
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="btn-secondary py-1 px-3 text-xs"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-600 py-1">Page {page}</span>
                  <button
                    onClick={() => setPage(p => p + 1)}
                    disabled={data.pagination.total <= page * data.pagination.limit}
                    className="btn-secondary py-1 px-3 text-xs"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
