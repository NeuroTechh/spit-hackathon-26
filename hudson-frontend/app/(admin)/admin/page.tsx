"use client";

import { useEffect, useState } from "react";
import { adminApi, type AdminStats, type UserReport } from "@/lib/api";
import { Users, CalendarDays, Flag, Star, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentReports, setRecentReports] = useState<UserReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      adminApi.getStats(),
      adminApi.listReports({ status: "pending", limit: 5 }),
    ]).then(([s, r]) => {
      if (s.status === "fulfilled") setStats(s.value);
      if (r.status === "fulfilled") setRecentReports(r.value.reports);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-brand-blue" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Admin Overview
        </h1>
        <p className="text-zinc-500 mt-1">
          Platform statistics and pending actions.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Users className="h-5 w-5" />}
          label="Total Users"
          value={String(stats?.totalUsers ?? 0)}
        />
        <StatCard
          icon={<CalendarDays className="h-5 w-5" />}
          label="Total Events"
          value={String(stats?.totalEvents ?? 0)}
        />
        <StatCard
          icon={<Flag className="h-5 w-5" />}
          label="Pending Reports"
          value={String(stats?.pendingReports ?? 0)}
        />
        <StatCard
          icon={<Star className="h-5 w-5" />}
          label="Avg Reputation"
          value={String(stats?.averageReputation ?? 0)}
        />
      </div>

      {/* Recent pending reports */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold tracking-tight text-zinc-900">
            Pending Reports
          </h2>
          <Link
            href="/admin/reports"
            className="text-sm text-zinc-600 hover:text-zinc-900 font-medium transition-colors"
          >
            View all
          </Link>
        </div>

        {recentReports.length === 0 ? (
          <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center">
            <Flag className="h-10 w-10 text-zinc-300 mx-auto mb-3" />
            <p className="text-sm text-zinc-500">No pending reports.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-zinc-200 bg-white divide-y divide-zinc-100">
            {recentReports.map((r) => (
              <div key={r.id} className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-zinc-900">
                      {r.target_user_name || "Unknown user"}
                    </p>
                    <p className="text-xs text-zinc-500 truncate max-w-xs">
                      {r.reason}
                    </p>
                  </div>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    r.severity === "critical"
                      ? "bg-red-50 text-red-700"
                      : r.severity === "high"
                      ? "bg-orange-50 text-orange-700"
                      : r.severity === "medium"
                      ? "bg-amber-50 text-amber-700"
                      : "bg-zinc-100 text-zinc-600"
                  }`}
                >
                  {r.severity}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className="text-zinc-400">{icon}</div>
        <p className="text-sm text-zinc-500">{label}</p>
      </div>
      <p className="text-2xl font-semibold tracking-tight text-zinc-900">
        {value}
      </p>
    </div>
  );
}
