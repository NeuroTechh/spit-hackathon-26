"use client";

import { useEffect, useState } from "react";
import {
  reputationApi,
  type ReputationScore,
  type ReputationRecord,
} from "@/lib/api";
import {
  Star,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Upload,
} from "lucide-react";

const actionLabels: Record<string, { label: string; color: string }> = {
  attendance: { label: "Attendance", color: "text-emerald-600" },
  checkin_success: { label: "Check-in", color: "text-blue-600" },
  fraud_attempt: { label: "Fraud Attempt", color: "text-red-600" },
  no_show: { label: "No Show", color: "text-amber-600" },
};

export default function ReputationPage() {
  const [score, setScore] = useState<ReputationScore | null>(null);
  const [history, setHistory] = useState<ReputationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    Promise.allSettled([
      reputationApi.getScore(),
      reputationApi.getHistory(),
    ]).then(([scoreResult, historyResult]) => {
      if (scoreResult.status === "fulfilled") setScore(scoreResult.value);
      if (historyResult.status === "fulfilled")
        setHistory(historyResult.value.history);
      setLoading(false);
    });
  }, []);

  const handlePublish = async () => {
    setPublishing(true);
    try {
      await reputationApi.publishOnChain();
      const updated = await reputationApi.getScore();
      setScore(updated);
    } finally {
      setPublishing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-brand-blue" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Reputation
          </h1>
          <p className="text-zinc-500 mt-1">
            Track your reputation score and activity history.
          </p>
        </div>
        <button
          onClick={handlePublish}
          disabled={publishing}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-zinc-200 text-sm font-medium text-zinc-700 hover:border-brand-blue hover:text-brand-blue disabled:opacity-50 transition-colors"
        >
          {publishing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          Publish On-Chain
        </button>
      </div>

      {/* Score Overview */}
      {score ? (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <ScoreCard
            label="Total Score"
            value={score.totalScore}
            icon={<Star className="h-5 w-5" />}
            large
          />
          <ScoreCard
            label="Attended"
            value={score.attendanceCount}
            icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />}
          />
          <ScoreCard
            label="Check-ins"
            value={score.checkinCount}
            icon={<TrendingUp className="h-4 w-4 text-blue-500" />}
          />
          <ScoreCard
            label="No Shows"
            value={score.noshowCount}
            icon={<Clock className="h-4 w-4 text-amber-500" />}
          />
          <ScoreCard
            label="Fraud"
            value={score.fraudCount}
            icon={<XCircle className="h-4 w-4 text-red-500" />}
          />
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center">
          <Star className="h-10 w-10 text-zinc-300 mx-auto mb-3" />
          <p className="text-sm text-zinc-500">
            No reputation score yet. Attend events to build your score.
          </p>
        </div>
      )}

      {/* On-chain Info */}
      {score?.scoreHash && (
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <p className="text-xs text-zinc-500 mb-1">On-chain Score Hash</p>
          <code className="text-xs font-mono text-zinc-600 break-all">
            {score.scoreHash}
          </code>
          {score.onChainTxHash && (
            <>
              <p className="text-xs text-zinc-500 mt-3 mb-1">
                Transaction Hash
              </p>
              <code className="text-xs font-mono text-zinc-600 break-all">
                {score.onChainTxHash}
              </code>
            </>
          )}
          {score.lastUpdated && (
            <p className="text-xs text-zinc-400 mt-3">
              Last updated:{" "}
              {new Date(score.lastUpdated).toLocaleString()}
            </p>
          )}
        </div>
      )}

      {/* History */}
      <section>
        <h2 className="text-lg font-semibold tracking-tight text-zinc-900 mb-4">
          Activity History
        </h2>

        {history.length === 0 ? (
          <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center">
            <Clock className="h-10 w-10 text-zinc-300 mx-auto mb-3" />
            <p className="text-sm text-zinc-500">No activity yet.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-zinc-200 bg-white divide-y divide-zinc-100">
            {history.map((record) => {
              const meta = actionLabels[record.action] || {
                label: record.action,
                color: "text-zinc-600",
              };
              const isPositive = record.points > 0;

              return (
                <div
                  key={record.id}
                  className="flex items-center justify-between px-5 py-4"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-8 w-8 rounded-full flex items-center justify-center ${
                        isPositive ? "bg-emerald-50" : "bg-red-50"
                      }`}
                    >
                      {isPositive ? (
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${meta.color}`}>
                        {meta.label}
                      </p>
                      {record.description && (
                        <p className="text-xs text-zinc-500">
                          {record.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-sm font-semibold ${
                        isPositive ? "text-emerald-600" : "text-red-600"
                      }`}
                    >
                      {isPositive ? "+" : ""}
                      {record.points}
                    </p>
                    <p className="text-xs text-zinc-400">
                      {new Date(record.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function ScoreCard({
  label,
  value,
  icon,
  large,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  large?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border border-zinc-200 bg-white p-5 ${
        large ? "col-span-2 sm:col-span-1" : ""
      }`}
    >
      <div className="flex items-center gap-2 mb-2 text-zinc-400">{icon}</div>
      <p
        className={`font-semibold tracking-tight text-zinc-900 ${
          large ? "text-3xl" : "text-xl"
        }`}
      >
        {value}
      </p>
      <p className="text-xs text-zinc-500 mt-1">{label}</p>
    </div>
  );
}
