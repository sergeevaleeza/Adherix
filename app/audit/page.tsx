"use client";

import { useEffect, useState, useCallback } from "react";
import PageHeader from "@/components/PageHeader";
import LoadingSpinner from "@/components/LoadingSpinner";
import EmptyState from "@/components/EmptyState";

interface AuditLog {
  id: string;
  actorName: string;
  action: string;
  entityType: string;
  entityId: string;
  metadataJson: string | null;
  createdAt: string;
}

const ACTION_COLORS: Record<string, string> = {
  CREATE_PATIENT: "bg-green-100 text-green-700",
  UPDATE_PATIENT: "bg-blue-100 text-blue-700",
  CREATE_ENROLLMENT: "bg-indigo-100 text-indigo-700",
  MARK_COMPLETED: "bg-green-100 text-green-700",
  MARK_MISSED: "bg-red-100 text-red-700",
  RESCHEDULE: "bg-yellow-100 text-yellow-700",
  CREATE_OUTREACH_TASK: "bg-orange-100 text-orange-700",
  OUTREACH_CONTACTED: "bg-teal-100 text-teal-700",
  OUTREACH_VOICEMAIL_LEFT: "bg-cyan-100 text-cyan-700",
  OUTREACH_RESCHEDULED: "bg-yellow-100 text-yellow-700",
  OUTREACH_CLOSED: "bg-gray-100 text-gray-600",
  GENERATE_AI_DRAFT: "bg-purple-100 text-purple-700",
  CSV_IMPORT: "bg-blue-100 text-blue-700",
  CREATE_PROTOCOL: "bg-indigo-100 text-indigo-700",
};

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 50;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/audit?page=${page}&limit=${LIMIT}`);
      const data = await res.json();
      setLogs(data.logs ?? []);
      setTotal(data.total ?? 0);
    } finally { setLoading(false); }
  }, [page]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div>
      <PageHeader
        title="Audit Log"
        subtitle={`${total} total log entries · Staff actions tracked for compliance`}
      />

      <div className="card overflow-hidden">
        {loading ? (
          <LoadingSpinner label="Loading audit log..." />
        ) : logs.length === 0 ? (
          <EmptyState
            icon="📋"
            title="No audit entries yet"
            description="Actions taken by staff will appear here."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Timestamp</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actor</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Action</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Entity</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Entity ID</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {logs.map((log) => {
                    let metadata: Record<string, unknown> = {};
                    try { if (log.metadataJson) metadata = JSON.parse(log.metadataJson); } catch {}
                    return (
                      <tr key={log.id} className="table-row-hover">
                        <td className="px-4 py-2.5 text-xs text-gray-500 font-mono whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString("en-US", {
                            month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                          })}
                        </td>
                        <td className="px-4 py-2.5 text-sm text-gray-700">{log.actorName}</td>
                        <td className="px-4 py-2.5">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ACTION_COLORS[log.action] ?? "bg-gray-100 text-gray-600"}`}>
                            {log.action.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-xs text-gray-500">{log.entityType}</td>
                        <td className="px-4 py-2.5 text-xs text-gray-400 font-mono truncate max-w-24">{log.entityId.slice(0, 12)}…</td>
                        <td className="px-4 py-2.5 text-xs text-gray-400 truncate max-w-48">
                          {Object.entries(metadata)
                            .slice(0, 3)
                            .map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : v}`)
                            .join(" · ")}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between text-sm">
                <span className="text-gray-500">
                  Page {page} of {totalPages} · {total} entries
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="btn btn-secondary btn-sm"
                  >
                    ← Prev
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="btn btn-secondary btn-sm"
                  >
                    Next →
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
