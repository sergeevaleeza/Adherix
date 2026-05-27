"use client";

import { useState, useCallback } from "react";
import Papa from "papaparse";
import PageHeader from "@/components/PageHeader";
import { validateCsvRow, CSV_TEMPLATE_EXAMPLE, type ParsedRow } from "@/lib/csvImport";

interface ImportResult {
  batchId: string;
  rowCount: number;
  importedCount: number;
  skippedCount: number;
  errors: { row: number; errors: string[] }[];
}

export default function ImportPage() {
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [filename, setFilename] = useState("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback((file: File) => {
    setFilename(file.name);
    setResult(null);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const validated = (res.data as Record<string, string>[]).map((row, i) => validateCsvRow(row, i + 1));
        setParsedRows(validated);
      },
    });
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file?.name.endsWith(".csv")) handleFile(file);
  }, [handleFile]);

  const handleImport = async () => {
    const validRows = parsedRows.filter((r) => r._valid);
    if (!validRows.length) return;
    setImporting(true);
    try {
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: validRows, filename }),
      });
      const data = await res.json();
      setResult(data);
    } catch {
      alert("Import failed. Please try again.");
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE_EXAMPLE], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "adherix_import_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const validCount = parsedRows.filter((r) => r._valid).length;
  const invalidCount = parsedRows.filter((r) => !r._valid).length;

  return (
    <div>
      <PageHeader
        title="CSV Import"
        subtitle="Import patients and treatment enrollments from a CSV file"
        action={
          <button onClick={downloadTemplate} className="btn btn-secondary">
            ↓ Download Template
          </button>
        }
      />

      {/* Upload area */}
      <div
        className={`border-2 border-dashed rounded-lg p-10 text-center transition-colors mb-6 ${
          dragOver ? "border-blue-400 bg-blue-50" : "border-gray-300 bg-white hover:border-gray-400"
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <div className="text-3xl mb-2">📂</div>
        <div className="text-sm font-medium text-gray-700 mb-1">
          Drop a CSV file here, or click to browse
        </div>
        <div className="text-xs text-gray-400 mb-4">
          Supports .csv files · Required columns: internal_id, display_name, treatment_name, provider_name
        </div>
        <label className="btn btn-secondary cursor-pointer">
          Choose File
          <input
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
        </label>
      </div>

      {/* Preview */}
      {parsedRows.length > 0 && (
        <div className="card mb-6">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <div>
              <span className="text-sm font-semibold text-gray-800">Preview: {filename}</span>
              <span className="ml-2 text-xs text-gray-500">{parsedRows.length} rows</span>
            </div>
            <div className="flex items-center gap-3">
              {validCount > 0 && <span className="text-xs text-green-600 font-medium">✓ {validCount} valid</span>}
              {invalidCount > 0 && <span className="text-xs text-red-600 font-medium">✗ {invalidCount} invalid</span>}
            </div>
          </div>
          <div className="overflow-x-auto max-h-80">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 sticky top-0">
                  <th className="text-left px-3 py-2 text-gray-500">#</th>
                  <th className="text-left px-3 py-2 text-gray-500">Status</th>
                  <th className="text-left px-3 py-2 text-gray-500">Internal ID</th>
                  <th className="text-left px-3 py-2 text-gray-500">Display Name</th>
                  <th className="text-left px-3 py-2 text-gray-500">Treatment</th>
                  <th className="text-left px-3 py-2 text-gray-500">Provider</th>
                  <th className="text-left px-3 py-2 text-gray-500">Last Date</th>
                  <th className="text-left px-3 py-2 text-gray-500">Next Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {parsedRows.map((row) => (
                  <tr key={row._rowIndex} className={row._valid ? "" : "bg-red-50"}>
                    <td className="px-3 py-2 text-gray-400">{row._rowIndex}</td>
                    <td className="px-3 py-2">
                      {row._valid ? (
                        <span className="text-green-600">✓</span>
                      ) : (
                        <span className="text-red-600 cursor-help" title={row._errors.join("; ")}>✗ {row._errors[0]}</span>
                      )}
                    </td>
                    <td className="px-3 py-2 font-mono">{row.internal_id}</td>
                    <td className="px-3 py-2">{row.display_name}</td>
                    <td className="px-3 py-2">{row.treatment_name}</td>
                    <td className="px-3 py-2">{row.provider_name}</td>
                    <td className="px-3 py-2">{row.last_treatment_date}</td>
                    <td className="px-3 py-2">{row.next_due_date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
            <button
              onClick={() => { setParsedRows([]); setFilename(""); setResult(null); }}
              className="btn btn-secondary btn-sm"
            >
              Clear
            </button>
            <button
              onClick={handleImport}
              disabled={validCount === 0 || importing}
              className="btn btn-primary"
            >
              {importing ? "Importing..." : `Import ${validCount} Valid Row${validCount !== 1 ? "s" : ""}`}
            </button>
          </div>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className={`card p-5 ${result.skippedCount === 0 ? "border-green-200 bg-green-50" : "border-yellow-200 bg-yellow-50"}`}>
          <div className="text-sm font-semibold text-gray-800 mb-2">Import Complete</div>
          <div className="flex gap-6 text-sm">
            <div>
              <span className="text-gray-500">Total rows:</span>{" "}
              <span className="font-medium">{result.rowCount}</span>
            </div>
            <div>
              <span className="text-green-600">Imported:</span>{" "}
              <span className="font-medium text-green-700">{result.importedCount}</span>
            </div>
            <div>
              <span className="text-red-500">Skipped:</span>{" "}
              <span className="font-medium text-red-600">{result.skippedCount}</span>
            </div>
          </div>
          {result.errors.length > 0 && (
            <div className="mt-3">
              <div className="text-xs font-medium text-red-600 mb-1">Errors:</div>
              {result.errors.slice(0, 5).map((e, i) => (
                <div key={i} className="text-xs text-red-500">Row {e.row}: {e.errors.join(", ")}</div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Format reference */}
      {parsedRows.length === 0 && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">Expected CSV Format</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {[
              { col: "internal_id", req: true, desc: "Unique patient identifier (e.g. PF-10001)" },
              { col: "display_name", req: true, desc: "Patient display name (e.g. J. Smith)" },
              { col: "treatment_name", req: true, desc: "Must match a protocol name (e.g. Vivitrol)" },
              { col: "provider_name", req: true, desc: "Provider name (e.g. Dr. Patel)" },
              { col: "last_treatment_date", req: false, desc: "YYYY-MM-DD format" },
              { col: "next_due_date", req: false, desc: "YYYY-MM-DD format" },
              { col: "phone_optional", req: false, desc: "Contact phone number" },
              { col: "email_optional", req: false, desc: "Contact email address" },
              { col: "notes", req: false, desc: "Free text notes" },
            ].map((f) => (
              <div key={f.col} className="flex gap-2">
                <code className={`font-mono shrink-0 ${f.req ? "text-blue-600" : "text-gray-500"}`}>{f.col}</code>
                <span className="text-gray-500">{f.req && <span className="text-red-400 mr-1">*</span>}{f.desc}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
