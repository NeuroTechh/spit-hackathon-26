"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";
import { userApi, credentialApi, reputationApi, type UserProfile, type Credential, type ReputationScore } from "@/lib/api";
import {
  ShieldCheck,
  Star,
  CalendarDays,
  Fingerprint,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [reputation, setReputation] = useState<ReputationScore | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [p, c, r] = await Promise.allSettled([
          userApi.getProfile(),
          credentialApi.list(),
          reputationApi.getScore(),
        ]);
        if (p.status === "fulfilled") setProfile(p.value);
        if (c.status === "fulfilled") setCredentials(c.value.credentials);
        if (r.status === "fulfilled") setReputation(r.value);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-brand-blue" />
      </div>
    );
  }

  const activeCredentials = credentials.filter((c) => c.status === "active");
  const hasAge = activeCredentials.some((c) => c.credential_type === "age");
  const hasKyc = activeCredentials.some((c) => c.credential_type === "kyc");

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Welcome back{profile?.displayName ? `, ${profile.displayName}` : ""}
        </h1>
        <p className="text-zinc-500 mt-1">
          Here&apos;s an overview of your identity and activity.
        </p>
      </div>

      {/* Onboarding nudge */}
      {(!hasAge || !hasKyc) && (
        <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-5">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-brand-blue mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-zinc-900 text-sm">
                Complete your identity verification
              </p>
              <p className="text-sm text-zinc-600 mt-1">
                {!hasAge && !hasKyc
                  ? "Verify your age and complete KYC to access all events and features."
                  : !hasAge
                  ? "Complete age verification to access age-restricted events."
                  : "Complete KYC verification for full platform access."}
              </p>
              <Link
                href="/verification"
                className="inline-flex items-center gap-1 text-sm font-medium text-brand-blue hover:text-blue-700 mt-2 transition-colors"
              >
                Start verification <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<ShieldCheck className="h-5 w-5" />}
          label="Active Credentials"
          value={String(activeCredentials.length)}
          href="/credentials"
        />
        <StatCard
          icon={<Star className="h-5 w-5" />}
          label="Reputation Score"
          value={reputation?.totalScore != null ? String(reputation.totalScore) : "—"}
          href="/reputation"
        />
        <StatCard
          icon={<CalendarDays className="h-5 w-5" />}
          label="Events Attended"
          value={reputation?.attendanceCount != null ? String(reputation.attendanceCount) : "0"}
          href="/events"
        />
        <StatCard
          icon={<Fingerprint className="h-5 w-5" />}
          label="Verifications"
          value={String(credentials.length)}
          href="/verification"
        />
      </div>

      {/* Credentials Overview */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold tracking-tight text-zinc-900">
            Your Credentials
          </h2>
          <Link
            href="/credentials"
            className="text-sm text-brand-blue hover:text-blue-700 font-medium transition-colors"
          >
            View all
          </Link>
        </div>

        {activeCredentials.length === 0 ? (
          <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center">
            <ShieldCheck className="h-10 w-10 text-zinc-300 mx-auto mb-3" />
            <p className="text-sm text-zinc-500">
              No active credentials yet. Complete a verification to get started.
            </p>
            <Link
              href="/verification"
              className="inline-flex items-center gap-1 text-sm font-medium text-brand-blue hover:text-blue-700 mt-3 transition-colors"
            >
              Start verification <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeCredentials.map((cred) => (
              <div
                key={cred.id}
                className="rounded-xl border border-zinc-200 bg-white p-5"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-9 w-9 rounded-lg bg-brand-blue/10 flex items-center justify-center">
                    <ShieldCheck className="h-4 w-4 text-brand-blue" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-900 capitalize">
                      {cred.credential_type.replace("_", " ")} Verification
                    </p>
                    <p className="text-xs text-emerald-600 font-medium">Active</p>
                  </div>
                </div>
                <p className="text-xs text-zinc-400 font-mono truncate">
                  {cred.credential_hash}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Quick Actions */}
      <section>
        <h2 className="text-lg font-semibold tracking-tight text-zinc-900 mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <QuickAction
            href="/events"
            title="Browse Events"
            description="Find events and mint passes"
            icon={<CalendarDays className="h-5 w-5" />}
          />
          <QuickAction
            href="/credentials"
            title="Generate Proof"
            description="Create zero-knowledge proofs"
            icon={<ShieldCheck className="h-5 w-5" />}
          />
          <QuickAction
            href="/reputation"
            title="View Reputation"
            description="Check your score and history"
            icon={<Star className="h-5 w-5" />}
          />
        </div>
      </section>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-zinc-200 bg-white p-5 hover:border-zinc-300 transition-colors group"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="text-zinc-400 group-hover:text-brand-blue transition-colors">
          {icon}
        </div>
        <p className="text-sm text-zinc-500">{label}</p>
      </div>
      <p className="text-2xl font-semibold tracking-tight text-zinc-900">
        {value}
      </p>
    </Link>
  );
}

function QuickAction({
  href,
  title,
  description,
  icon,
}: {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 rounded-xl border border-zinc-200 bg-white p-5 hover:border-brand-blue/30 transition-colors group"
    >
      <div className="h-10 w-10 rounded-lg bg-zinc-50 flex items-center justify-center text-zinc-400 group-hover:bg-brand-blue/10 group-hover:text-brand-blue transition-colors shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-zinc-900">{title}</p>
        <p className="text-xs text-zinc-500">{description}</p>
      </div>
    </Link>
  );
}
