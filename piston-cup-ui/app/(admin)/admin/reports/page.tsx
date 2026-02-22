"use client";

import { useEffect, useState } from "react";
import { adminApi, type UserReport } from "@/lib/api";
import {
  Flag,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertTriangle,
} from "lucide-react";

const TABS = [
  { label: "All", value: "" },
  { label: "Pending", value: "pending" },
  { label: "Reviewed", value: "reviewed" },
  { label: "Dismissed", value: "dismissed" },
];

const severityColor: Record<string, string> = {
  low: "bg-zinc-100 text-zinc-600",
  medium: "bg-amber-50 text-amber-700",
  high: "bg-orange-50 text-orange-700",
  critical: "bg-red-50 text-red-700",
};

const statusColor: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700",
  reviewed: "bg-emerald-50 text-emerald-700",
  dismissed: "bg-zinc-100 text-zinc-600",
};

const basePenalty: Record<string, number> = {
  low: -5,
  medium: -15,
  high: -30,
  critical: -50,
};

export default function AdminReportsPage() {
  const [reports, setReports] = useState<UserReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("");

  // Process modal
  const [activeReport, setActiveReport] = useState<UserReport | null>(null);
  const [decision, setDecision] = useState<"apply" | "dismiss">("apply");
  const [notes, setNotes] = useState("");
  const [processing, setProcessing] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const fetchReports = (status?: string) => {
    setLoading(true);
    adminApi
      .listReports({ status: status || undefined })
      .then((r) => setReports(r.reports))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchReports(tab);
  }, [tab]);

  const handleProcess = async () => {
    if (!activeReport) return;
    setProcessing(true);
    try {
      await adminApi.processReport(activeReport.id, {
        decision,
        notes: notes || undefined,
      });
      setActiveReport(null);
      setNotes("");
      setSuccessMsg(
        decision === "apply"
          ? "Report reviewed — score adjustment applied."
          : "Report dismissed."
      );
      setTimeout(() => setSuccessMsg(""), 3000);
      fetchReports(tab);
    } catch {
      // stay in modal
    } finally {
      setProcessing(false);
    }
  };

  const estimatedPenalty = activeReport
    ? basePenalty[activeReport.severity] || -15
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Reports
        </h1>
        <p className="text-zinc-500 text-sm mt-1">
          Review user reports and apply fair score adjustments
        </p>
      </div>

      {successMsg && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <p className="text-sm text-emerald-700">{successMsg}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              tab === t.value
                ? "bg-brand-blue text-white"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-brand-blue" />
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-20">
          <Flag className="h-10 w-10 text-zinc-300 mx-auto mb-3" />
          <p className="text-zinc-500 text-sm">No reports found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <div
              key={report.id}
              className="rounded-xl border border-zinc-200 bg-white p-5"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        severityColor[report.severity]
                      }`}
                    >
                      {report.severity}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        statusColor[report.status]
                      }`}
                    >
                      {report.status}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-700">{report.reason}</p>
                  <div className="flex gap-4 text-xs text-zinc-400">
                    <span>
                      Target: {report.target_user_name || report.target_user_id.slice(0, 8)}
                    </span>
                    <span>
                      Reporter: {report.reporter_name || report.reporter_id.slice(0, 8)}
                    </span>
                    <span>
                      {new Date(report.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {report.admin_notes && (
                    <p className="text-xs text-zinc-500 mt-1">
                      Notes: {report.admin_notes}
                    </p>
                  )}
                  {report.score_adjustment !== 0 && (
                    <p className="text-xs font-medium text-red-600">
                      Score adjustment: {report.score_adjustment}
                    </p>
                  )}
                </div>

                {report.status === "pending" && (
                  <button
                    onClick={() => {
                      setActiveReport(report);
                      setDecision("apply");
                      setNotes("");
                    }}
                    className="px-3 py-1.5 rounded-lg bg-brand-blue text-white text-xs font-medium hover:bg-blue-700 transition-colors shrink-0"
                  >
                    Review
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Process Modal */}
      {activeReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-xl border border-zinc-200 shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <h3 className="text-lg font-semibold text-zinc-900">
                Review Report
              </h3>
            </div>

            <div className="rounded-lg bg-zinc-50 p-3 space-y-1">
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    severityColor[activeReport.severity]
                  }`}
                >
                  {activeReport.severity}
                </span>
                <span className="text-xs text-zinc-400">
                  Target: {activeReport.target_user_name || activeReport.target_user_id.slice(0, 8)}
                </span>
              </div>
              <p className="text-sm text-zinc-700">{activeReport.reason}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">
                Decision
              </label>
              <div className="flex gap-3">
                <button
                  onClick={() => setDecision("apply")}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors flex items-center justify-center gap-2 ${
                    decision === "apply"
                      ? "border-red-300 bg-red-50 text-red-700"
                      : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                  }`}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Apply Penalty
                </button>
                <button
                  onClick={() => setDecision("dismiss")}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors flex items-center justify-center gap-2 ${
                    decision === "dismiss"
                      ? "border-zinc-400 bg-zinc-100 text-zinc-800"
                      : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                  }`}
                >
                  <XCircle className="h-4 w-4" />
                  Dismiss
                </button>
              </div>
            </div>

            {decision === "apply" && (
              <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3">
                <p className="text-sm text-amber-800">
                  Base penalty for <strong>{activeReport.severity}</strong> severity:{" "}
                  <strong>{estimatedPenalty}</strong> points.
                </p>
                <p className="text-xs text-amber-600 mt-1">
                  Final penalty depends on the user&apos;s prior offense count
                  (0.5x first offense, 1x second, 1.5x third+).
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">
                Admin Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Add notes about your decision..."
                className="w-full px-3 py-2 rounded-lg border border-zinc-300 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 outline-none text-sm resize-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleProcess}
                disabled={processing}
                className={`flex-1 py-2.5 rounded-lg text-white text-sm font-medium disabled:opacity-50 transition-colors flex items-center justify-center gap-2 ${
                  decision === "apply"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-brand-blue hover:bg-blue-700"
                }`}
              >
                {processing && <Loader2 className="h-4 w-4 animate-spin" />}
                {decision === "apply" ? "Apply Penalty" : "Dismiss Report"}
              </button>
              <button
                onClick={() => setActiveReport(null)}
                className="px-4 py-2.5 rounded-lg border border-zinc-200 text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
