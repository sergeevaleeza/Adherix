"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import LoadingSpinner from "@/components/LoadingSpinner";

interface Protocol {
  id: string;
  name: string;
  category: string;
  defaultIntervalDays: number;
  dueSoonDays: number;
  overdueAfterDays: number;
  escalationAfterDays: number;
  description: string | null;
  isBuiltIn: boolean;
  _count: { enrollments: number };
}

const CATEGORY_COLORS: Record<string, string> = {
  "Addiction Medicine": "bg-cyan-50 text-cyan-700 border-cyan-200",
  "Schizophrenia": "bg-purple-50 text-purple-700 border-purple-200",
  "Ketamine": "bg-indigo-50 text-indigo-700 border-indigo-200",
  "Spravato": "bg-teal-50 text-teal-700 border-teal-200",
};

export default function ProtocolsPage() {
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchProtocols = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/protocols");
      const data = await res.json();
      setProtocols(data.protocols ?? []);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchProtocols(); }, []);

  const grouped = protocols.reduce<Record<string, Protocol[]>>((acc, p) => {
    const cat = p.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {});

  return (
    <div>
      <PageHeader
        title="Treatment Protocols"
        subtitle={`${protocols.length} protocol${protocols.length !== 1 ? "s" : ""} configured`}
        action={
          <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
            + Add Protocol
          </button>
        }
      />

      {loading ? (
        <LoadingSpinner label="Loading protocols..." />
      ) : protocols.length === 0 ? (
        <EmptyState icon="💊" title="No protocols found" description="Add treatment protocols to start tracking patients." />
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category}>
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">{category}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {items.map((p) => (
                  <div key={p.id} className="card p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-gray-900">{p.name}</div>
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium mt-1 inline-block ${CATEGORY_COLORS[p.category] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}>
                          {p.category}
                        </span>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <div className="text-xs text-gray-400">
                          {p._count.enrollments} patient{p._count.enrollments !== 1 ? "s" : ""}
                        </div>
                        {p.isBuiltIn && (
                          <span className="text-xs text-blue-500">Built-in</span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-1 mt-3 text-xs">
                      <div className="bg-gray-50 rounded px-2 py-1.5">
                        <div className="text-gray-400">Interval</div>
                        <div className="font-medium text-gray-700">Every {p.defaultIntervalDays} days</div>
                      </div>
                      <div className="bg-blue-50 rounded px-2 py-1.5">
                        <div className="text-blue-400">Due Soon</div>
                        <div className="font-medium text-blue-700">{p.dueSoonDays} days before</div>
                      </div>
                      <div className="bg-yellow-50 rounded px-2 py-1.5">
                        <div className="text-yellow-500">Overdue After</div>
                        <div className="font-medium text-yellow-700">+{p.overdueAfterDays} days</div>
                      </div>
                      <div className="bg-red-50 rounded px-2 py-1.5">
                        <div className="text-red-400">Escalate After</div>
                        <div className="font-medium text-red-700">+{p.escalationAfterDays} days</div>
                      </div>
                    </div>

                    {p.description && (
                      <p className="text-xs text-gray-500 mt-2">{p.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <AddProtocolModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => { setShowAddModal(false); fetchProtocols(); }}
        />
      )}
    </div>
  );
}

function AddProtocolModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({
    name: "", category: "", defaultIntervalDays: "30", dueSoonDays: "7",
    overdueAfterDays: "3", escalationAfterDays: "7", description: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/protocols", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          defaultIntervalDays: parseInt(form.defaultIntervalDays),
          dueSoonDays: parseInt(form.dueSoonDays),
          overdueAfterDays: parseInt(form.overdueAfterDays),
          escalationAfterDays: parseInt(form.escalationAfterDays),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed"); return; }
      onSuccess();
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 overflow-y-auto max-h-screen">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Add Custom Protocol</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          {[
            { key: "name", label: "Protocol Name *", placeholder: "e.g. Custom Monthly Injection" },
            { key: "category", label: "Category *", placeholder: "e.g. Addiction Medicine" },
            { key: "description", label: "Description", placeholder: "Brief description..." },
          ].map((f) => (
            <div key={f.key}>
              <label className="block text-xs font-medium text-gray-700 mb-1">{f.label}</label>
              <input
                type="text"
                placeholder={f.placeholder}
                value={form[f.key as keyof typeof form]}
                onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ))}
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: "defaultIntervalDays", label: "Interval (days) *" },
              { key: "dueSoonDays", label: "Due Soon (days before)" },
              { key: "overdueAfterDays", label: "Overdue After (days past)" },
              { key: "escalationAfterDays", label: "Escalate After (days past)" },
            ].map((f) => (
              <div key={f.key}>
                <label className="block text-xs font-medium text-gray-700 mb-1">{f.label}</label>
                <input
                  type="number"
                  min="1"
                  value={form[f.key as keyof typeof form]}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn btn-primary flex-1">
              {loading ? "Adding..." : "Add Protocol"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
