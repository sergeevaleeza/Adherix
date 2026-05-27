"use client";

import { useEffect, useState, useCallback } from "react";
import PageHeader from "@/components/PageHeader";
import LoadingSpinner from "@/components/LoadingSpinner";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type Period = "7d" | "30d" | "90d" | "custom";

interface ReportData {
  period: { from: string; to: string; label: string };
  summary: {
    totalPatients: number;
    activeEnrollments: number;
    completedTreatments: number;
    missedTreatments: number;
    adherenceRate: number;
    avgDaysOverdue: number;
    outreachTasksCreated: number;
    outreachTasksResolved: number;
    rescheduleRate: number;
  };
  byProtocol: Array<{
    protocolName: string;
    category: string;
    completed: number;
    missed: number;
    adherenceRate: number;
    activePatients: number;
  }>;
  weeklyTrend: Array<{
    weekLabel: string;
    weekStart: string;
    completed: number;
    missed: number;
    adherenceRate: number;
  }>;
  outreachMetrics: {
    avgAttemptsTillResolved: number;
    methodBreakdown: Record<string, number>;
    avgDaysToReschedule: number;
  };
  staffActivity: Array<{
    actorName: string;
    actionsCount: number;
    aiDraftsGenerated: number;
  }>;
}

function fmt1(n: number): string {
  return n.toFixed(1);
}

function adherenceColor(rate: number): string {
  if (rate >= 85) return "bg-green-100 text-green-800 border-green-300";
  if (rate >= 70) return "bg-yellow-100 text-yellow-800 border-yellow-300";
  return "bg-red-100 text-red-800 border-red-300";
}

function adherenceCardColor(rate: number): string {
  if (rate >= 85) return "text-green-600";
  if (rate >= 70) return "text-yellow-600";
  return "text-red-600";
}

function exportCSV(data: ReportData) {
  const lines: string[] = [];

  lines.push("CLINIVORE OUTCOMES REPORT");
  lines.push(`Period,${data.period.label}`);
  lines.push("");

  lines.push("SUMMARY");
  lines.push(`Total Active Patients,${data.summary.totalPatients}`);
  lines.push(`Active Enrollments,${data.summary.activeEnrollments}`);
  lines.push(`Completed Treatments,${data.summary.completedTreatments}`);
  lines.push(`Missed Treatments,${data.summary.missedTreatments}`);
  lines.push(`Adherence Rate,${fmt1(data.summary.adherenceRate)}%`);
  lines.push(`Outreach Tasks Created,${data.summary.outreachTasksCreated}`);
  lines.push(`Outreach Tasks Resolved,${data.summary.outreachTasksResolved}`);
  lines.push(`Reschedule Rate,${fmt1(data.summary.rescheduleRate)}%`);
  lines.push("");

  lines.push("ADHERENCE BY PROTOCOL");
  lines.push("Protocol,Category,Completed,Missed,Adherence Rate,Active Patients");
  for (const p of data.byProtocol) {
    lines.push(`"${p.protocolName}","${p.category}",${p.completed},${p.missed},${fmt1(p.adherenceRate)}%,${p.activePatients}`);
  }
  lines.push("");

  lines.push("WEEKLY TREND");
  lines.push("Week,Completed,Missed,Adherence Rate");
  for (const w of data.weeklyTrend) {
    lines.push(`"${w.weekLabel}",${w.completed},${w.missed},${fmt1(w.adherenceRate)}%`);
  }

  const csv = lines.join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `clinivore-report-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const [period, setPeriod] = useState<Period>("30d");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ period });
      if (period === "custom" && customFrom && customTo) {
        params.set("from", customFrom);
        params.set("to", customTo);
      }
      const res = await fetch(`/api/reports?${params}`);
      const json = await res.json();
      setData(json);
    } finally {
      setLoading(false);
    }
  }, [period, customFrom, customTo]);

  useEffect(() => {
    if (period !== "custom" || (customFrom && customTo)) {
      fetchData();
    }
  }, [fetchData, period, customFrom, customTo]);

  const periodLabel = data?.period.label ?? "";

  const PERIODS: { value: Period; label: string }[] = [
    { value: "7d", label: "Last 7 days" },
    { value: "30d", label: "Last 30 days" },
    { value: "90d", label: "Last 90 days" },
    { value: "custom", label: "Custom range" },
  ];

  const topMethod = data
    ? Object.entries(data.outreachMetrics.methodBreakdown).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—"
    : "—";

  return (
    <div>
      <PageHeader
        title="Outcomes Report"
        subtitle={periodLabel}
        action={
          data && (
            <button
              onClick={() => exportCSV(data)}
              className="btn btn-secondary text-xs"
            >
              ⬇ Download Report CSV
            </button>
          )
        }
      />

      {/* Period selector */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {PERIODS.map((p) => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors border ${
              period === p.value
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            {p.label}
          </button>
        ))}
        {period === "custom" && (
          <div className="flex items-center gap-2 ml-2">
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-500">to</span>
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}
      </div>

      {loading ? (
        <LoadingSpinner label="Loading report..." />
      ) : !data ? (
        <div className="text-center py-16 text-gray-400 text-sm">Failed to load report data.</div>
      ) : data.summary.completedTreatments + data.summary.missedTreatments === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">📊</div>
          <div className="text-sm font-medium text-gray-500">No data for this period</div>
          <div className="text-xs mt-1">Try expanding the date range.</div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="card p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{data.summary.completedTreatments}</div>
              <div className="text-xs text-gray-500 mt-1">Completed</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{data.summary.missedTreatments}</div>
              <div className="text-xs text-gray-500 mt-1">Missed</div>
            </div>
            <div className="card p-4 text-center">
              <div className={`text-2xl font-bold ${adherenceCardColor(data.summary.adherenceRate)}`}>
                {fmt1(data.summary.adherenceRate)}%
              </div>
              <div className="text-xs text-gray-500 mt-1">Adherence Rate</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{data.summary.outreachTasksResolved}</div>
              <div className="text-xs text-gray-500 mt-1">Outreach Resolved</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{fmt1(data.summary.rescheduleRate)}%</div>
              <div className="text-xs text-gray-500 mt-1">Reschedule Rate</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{data.summary.totalPatients}</div>
              <div className="text-xs text-gray-500 mt-1">Active Patients</div>
            </div>
          </div>

          {/* Adherence trend chart */}
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Adherence Trend</h2>
            {data.weeklyTrend.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">No weekly data available.</div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={data.weeklyTrend} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="weekLabel" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11 }} label={{ value: "Count", angle: -90, position: "insideLeft", style: { fontSize: 10 } }} />
                  <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fontSize: 11 }} label={{ value: "%", position: "insideRight", style: { fontSize: 10 } }} />
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      name === "adherenceRate" ? `${fmt1(value)}%` : value,
                      name === "adherenceRate" ? "Adherence %" : name === "completed" ? "Completed" : "Missed",
                    ]}
                  />
                  <Legend formatter={(value) => value === "adherenceRate" ? "Adherence %" : value === "completed" ? "Completed" : "Missed"} />
                  <Bar yAxisId="left" dataKey="completed" fill="#16a34a" name="completed" radius={[2, 2, 0, 0]} />
                  <Bar yAxisId="left" dataKey="missed" fill="#dc2626" name="missed" radius={[2, 2, 0, 0]} />
                  <Line yAxisId="right" type="monotone" dataKey="adherenceRate" stroke="#2563eb" dot={false} strokeWidth={2} name="adherenceRate" />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Adherence by protocol */}
          <div className="card">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-700">Adherence by Protocol</h2>
              <p className="text-xs text-gray-400 mt-0.5">Sorted by adherence rate — worst first</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">Protocol</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-3 py-3">Category</th>
                    <th className="text-right text-xs font-medium text-gray-500 px-3 py-3">Completed</th>
                    <th className="text-right text-xs font-medium text-gray-500 px-3 py-3">Missed</th>
                    <th className="text-center text-xs font-medium text-gray-500 px-3 py-3">Adherence</th>
                    <th className="text-right text-xs font-medium text-gray-500 px-5 py-3">Active Patients</th>
                  </tr>
                </thead>
                <tbody>
                  {data.byProtocol.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-gray-400 text-sm">
                        No protocol data for this period.
                      </td>
                    </tr>
                  ) : (
                    data.byProtocol.map((p) => (
                      <tr key={p.protocolName} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3 font-medium text-gray-900">{p.protocolName}</td>
                        <td className="px-3 py-3 text-gray-500">{p.category}</td>
                        <td className="px-3 py-3 text-right text-green-700 font-medium">{p.completed}</td>
                        <td className="px-3 py-3 text-right text-red-600 font-medium">{p.missed}</td>
                        <td className="px-3 py-3 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium border ${adherenceColor(p.adherenceRate)}`}>
                            {fmt1(p.adherenceRate)}%
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right text-gray-700">{p.activePatients}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom row: Outreach metrics + Staff activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Outreach metrics */}
            <div className="card p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-4">Outreach Metrics</h2>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-xl font-bold text-gray-800">
                    {fmt1(data.outreachMetrics.avgAttemptsTillResolved)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Avg attempts per resolved task</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-gray-800">
                    {fmt1(data.outreachMetrics.avgDaysToReschedule)}d
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Avg days missed → rescheduled</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-bold text-gray-800 truncate">
                    {topMethod.replace(/_/g, " ")}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Top outreach method</div>
                </div>
              </div>

              {Object.keys(data.outreachMetrics.methodBreakdown).length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="text-xs font-medium text-gray-500 mb-2">Method breakdown</div>
                  <div className="space-y-1">
                    {Object.entries(data.outreachMetrics.methodBreakdown)
                      .sort((a, b) => b[1] - a[1])
                      .map(([method, count]) => (
                        <div key={method} className="flex justify-between text-xs">
                          <span className="text-gray-600">{method.replace(/_/g, " ")}</span>
                          <span className="font-medium text-gray-800">{count}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* Staff activity */}
            <div className="card">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-700">Staff Activity</h2>
                <p className="text-xs text-gray-400 mt-0.5">From audit log — shows platform adoption</p>
              </div>
              {data.staffActivity.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">No activity recorded.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">Staff Member</th>
                      <th className="text-right text-xs font-medium text-gray-500 px-3 py-3">Total Actions</th>
                      <th className="text-right text-xs font-medium text-gray-500 px-5 py-3">AI Drafts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.staffActivity.map((s) => (
                      <tr key={s.actorName} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3 font-medium text-gray-900">{s.actorName}</td>
                        <td className="px-3 py-3 text-right text-gray-700">{s.actionsCount}</td>
                        <td className="px-5 py-3 text-right text-blue-600">{s.aiDraftsGenerated}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
