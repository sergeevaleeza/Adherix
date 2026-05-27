"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import StatusBadge from "@/components/StatusBadge";
import LoadingSpinner from "@/components/LoadingSpinner";
import { formatDate, daysFromNow, daysLabel, type TreatmentStatus } from "@/lib/status";

interface DashboardData {
  stats: {
    dueToday: number;
    dueThisWeek: number;
    overdue: number;
    needsOutreach: number;
    highPriority: number;
    completedThisWeek: number;
  };
  urgentPatients: {
    patientId: string;
    displayName: string;
    internalId: string;
    providerName: string;
    protocolName: string;
    nextDueDate: string | null;
    status: string;
  }[];
  statusCounts: Record<string, number>;
}

const STAT_CARDS = [
  { key: "highPriority", label: "High Priority", icon: "🔴", color: "border-l-purple-500", textColor: "text-purple-700", bg: "bg-purple-50" },
  { key: "overdue", label: "Overdue", icon: "⚠️", color: "border-l-red-500", textColor: "text-red-700", bg: "bg-red-50" },
  { key: "dueToday", label: "Due Today", icon: "📅", color: "border-l-yellow-500", textColor: "text-yellow-700", bg: "bg-yellow-50" },
  { key: "dueThisWeek", label: "Due This Week", icon: "📆", color: "border-l-blue-500", textColor: "text-blue-700", bg: "bg-blue-50" },
  { key: "needsOutreach", label: "Needs Outreach", icon: "📞", color: "border-l-orange-500", textColor: "text-orange-700", bg: "bg-orange-50" },
  { key: "completedThisWeek", label: "Completed This Week", icon: "✅", color: "border-l-green-500", textColor: "text-green-700", bg: "bg-green-50" },
];

const CHART_COLORS: Record<string, string> = {
  HIGH_PRIORITY: "#7c3aed",
  OVERDUE: "#dc2626",
  NEEDS_OUTREACH: "#ea580c",
  DUE_TODAY: "#d97706",
  DUE_SOON: "#2563eb",
  ON_TRACK: "#16a34a",
};

const CHART_LABELS: Record<string, string> = {
  HIGH_PRIORITY: "High Priority",
  OVERDUE: "Overdue",
  NEEDS_OUTREACH: "Needs Outreach",
  DUE_TODAY: "Due Today",
  DUE_SOON: "Due Soon",
  ON_TRACK: "On Track",
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => { setError("Failed to load dashboard"); setLoading(false); });
  }, []);

  const chartData = data
    ? Object.entries(data.statusCounts)
        .filter(([, v]) => v > 0)
        .map(([k, v]) => ({ name: CHART_LABELS[k] ?? k, count: v, key: k }))
    : [];

  if (loading) return <LoadingSpinner label="Loading dashboard..." />;
  if (error) return <div className="text-red-600 py-8">{error}</div>;
  if (!data) return null;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Treatment Continuity Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {STAT_CARDS.map((card) => (
          <div
            key={card.key}
            className={`card border-l-4 ${card.color} p-4`}
          >
            <div className="text-xs text-gray-500 font-medium mb-1">{card.label}</div>
            <div className={`text-2xl font-bold ${card.textColor}`}>
              {data.stats[card.key as keyof typeof data.stats]}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Urgent patients */}
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-800">Urgent Patients</h2>
            <Link href="/patients" className="text-xs text-blue-600 hover:underline">View all →</Link>
          </div>

          {data.urgentPatients.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">
              No urgent patients — all treatments are on track!
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {data.urgentPatients.map((p) => {
                const days = daysFromNow(p.nextDueDate);
                return (
                  <div key={p.patientId} className="flex items-center justify-between py-2.5 gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/patients/${p.patientId}`}
                          className="text-sm font-medium text-gray-900 hover:text-blue-600 truncate"
                        >
                          {p.displayName}
                        </Link>
                        <span className="text-xs text-gray-400 font-mono">{p.internalId}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {p.protocolName} · {p.providerName}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-gray-500">{daysLabel(days)}</span>
                      <StatusBadge status={p.status as TreatmentStatus} size="sm" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-4 pt-3 border-t border-gray-100">
            <Link href="/outreach" className="btn btn-secondary btn-sm w-full justify-center">
              View Outreach Queue
            </Link>
          </div>
        </div>

        {/* Chart */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">Treatment Status Overview</h2>
          {chartData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">No data</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 20 }}>
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={95} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 6 }}
                  formatter={(v) => [v, "Patients"]}
                />
                <Bar dataKey="count" radius={[0, 3, 3, 0]}>
                  {chartData.map((entry) => (
                    <Cell key={entry.key} fill={CHART_COLORS[entry.key] ?? "#94a3b8"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
