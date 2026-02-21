"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  adminApi,
  userApi,
  type AdminUserDetail,
} from "@/lib/api";
import {
  ArrowLeft,
  Shield,
  Star,
  Flag,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

export default function AdminUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [user, setUser] = useState<AdminUserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState("");
  const [roleUpdating, setRoleUpdating] = useState(false);
  const [roleSuccess, setRoleSuccess] = useState(false);

  // Report modal
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportSeverity, setReportSeverity] = useState<string>("medium");
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    adminApi
      .getUser(userId)
      .then((u) => {
        setUser(u);
        setSelectedRole(u.role);
      })
      .catch(() => router.push("/admin/users"))
      .finally(() => setLoading(false));
  }, [userId, router]);

  const handleRoleUpdate = async () => {
    if (!selectedRole || selectedRole === user?.role) return;
    setRoleUpdating(true);
    setRoleSuccess(false);
    try {
      await userApi.updateRole(userId, selectedRole);
      setUser((prev) => (prev ? { ...prev, role: selectedRole } : prev));
      setRoleSuccess(true);
      setTimeout(() => setRoleSuccess(false), 3000);
    } catch {
      setError("Failed to update role.");
    } finally {
      setRoleUpdating(false);
    }
  };

  const handleSubmitReport = async () => {
    if (!reportReason.trim()) return;
    setReportSubmitting(true);
    setError("");
    try {
      await adminApi.submitReport({
        targetUserId: userId,
        reason: reportReason,
        severity: reportSeverity,
      });
      setReportSuccess(true);
      setShowReport(false);
      setReportReason("");
      setTimeout(() => setReportSuccess(false), 3000);
    } catch {
      setError("Failed to submit report.");
    } finally {
      setReportSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-brand-blue" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="space-y-8">
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Users
      </Link>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50/50 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {reportSuccess && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <p className="text-sm text-emerald-700">Report submitted. It will be reviewed in the Reports section.</p>
        </div>
      )}

      {/* Profile Card */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold text-zinc-900">
              {user.displayName || "Unnamed User"}
            </h1>
            <p className="text-sm text-zinc-500 font-mono mt-1">{user.did}</p>
            {user.walletAddress && (
              <p className="text-xs text-zinc-400 font-mono mt-0.5">
                {user.walletAddress}
              </p>
            )}
            <p className="text-sm text-zinc-500 mt-2">
              Joined {new Date(user.createdAt).toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={() => setShowReport(true)}
            className="px-4 py-2 rounded-lg border border-red-200 text-sm font-medium text-red-700 hover:bg-red-50 transition-colors flex items-center gap-2"
          >
            <Flag className="h-4 w-4" />
            Report
          </button>
        </div>

        {/* Role Update */}
        <div className="mt-6 pt-6 border-t border-zinc-100 flex items-center gap-3">
          <Shield className="h-4 w-4 text-zinc-400" />
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="px-3 py-2 rounded-lg border border-zinc-300 text-sm"
          >
            <option value="user">User</option>
            <option value="organizer">Organizer</option>
            <option value="verifier">Verifier</option>
            <option value="admin">Admin</option>
          </select>
          <button
            onClick={handleRoleUpdate}
            disabled={roleUpdating || selectedRole === user.role}
            className="px-4 py-2 rounded-lg bg-brand-blue text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {roleUpdating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Update Role
          </button>
          {roleSuccess && (
            <span className="text-sm text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4" /> Updated
            </span>
          )}
        </div>
      </div>

      {/* Reputation */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-zinc-900 mb-4 flex items-center gap-2">
          <Star className="h-5 w-5 text-zinc-400" />
          Reputation
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
          <MiniStat label="Total Score" value={user.reputationScore} />
          <MiniStat label="Attendance" value={user.attendanceCount} />
          <MiniStat label="Check-ins" value={user.checkinCount} />
          <MiniStat label="Fraud" value={user.fraudCount} />
          <MiniStat label="No-shows" value={user.noshowCount} />
        </div>

        {/* History */}
        <h3 className="text-sm font-medium text-zinc-700 mb-2">
          Recent History
        </h3>
        {user.reputationHistory.length === 0 ? (
          <p className="text-sm text-zinc-400">No reputation history.</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {user.reputationHistory.map((h) => (
              <div
                key={h.id}
                className="flex items-center justify-between px-3 py-2 rounded-lg bg-zinc-50"
              >
                <div>
                  <p className="text-sm text-zinc-700">{h.description || h.action}</p>
                  <p className="text-xs text-zinc-400">
                    {new Date(h.createdAt).toLocaleString()}
                  </p>
                </div>
                <span
                  className={`text-sm font-medium ${
                    h.points >= 0 ? "text-emerald-600" : "text-red-600"
                  }`}
                >
                  {h.points > 0 ? "+" : ""}
                  {h.points}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Report Modal */}
      {showReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-xl border border-zinc-200 shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              <h3 className="text-lg font-semibold text-zinc-900">
                Report User
              </h3>
            </div>
            <p className="text-sm text-zinc-500">
              This creates a pending report. It must be reviewed before any score adjustment is applied.
            </p>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">
                Reason
              </label>
              <textarea
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                rows={3}
                placeholder="Describe the issue..."
                className="w-full px-3 py-2 rounded-lg border border-zinc-300 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 outline-none text-sm resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">
                Severity
              </label>
              <select
                value={reportSeverity}
                onChange={(e) => setReportSeverity(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-zinc-300 text-sm"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleSubmitReport}
                disabled={reportSubmitting || !reportReason.trim()}
                className="flex-1 py-2.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {reportSubmitting && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                Submit Report
              </button>
              <button
                onClick={() => setShowReport(false)}
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

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <p className="text-xl font-semibold text-zinc-900">{value}</p>
      <p className="text-xs text-zinc-500">{label}</p>
    </div>
  );
}
