"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { userApi, identityApi, type UserProfile } from "@/lib/api";
import {
  User,
  Fingerprint,
  ShieldCheck,
  ArrowRight,
  Loader2,
  CheckCircle2,
} from "lucide-react";

type Step = "profile" | "age" | "kyc" | "complete";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("profile");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    userApi
      .getProfile()
      .then((p) => {
        setProfile(p);
        setDisplayName(p.displayName);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleUpdateName = async () => {
    if (!displayName.trim()) return;
    setSaving(true);
    try {
      await userApi.updateProfile(displayName.trim());
      setStep("age");
    } finally {
      setSaving(false);
    }
  };

  const handleInitVerification = async (type: "age" | "kyc") => {
    setSaving(true);
    try {
      await identityApi.initVerification(type);
      if (type === "age") {
        setStep("kyc");
      } else {
        setStep("complete");
      }
    } catch {
      // Still allow user to proceed — verification is async
      if (type === "age") setStep("kyc");
      else setStep("complete");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-brand-blue" />
      </div>
    );
  }

  const steps = [
    { key: "profile", label: "Profile" },
    { key: "age", label: "Age" },
    { key: "kyc", label: "KYC" },
    { key: "complete", label: "Done" },
  ];
  const currentIndex = steps.findIndex((s) => s.key === step);

  return (
    <div className="max-w-lg mx-auto space-y-8">
      {/* Progress */}
      <div className="flex items-center gap-2">
        {steps.map((s, i) => (
          <div key={s.key} className="flex items-center gap-2 flex-1">
            <div
              className={`h-2 flex-1 rounded-full ${
                i <= currentIndex ? "bg-brand-blue" : "bg-zinc-200"
              }`}
            />
          </div>
        ))}
      </div>

      {/* Step Content */}
      {step === "profile" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">
              Set up your profile
            </h2>
            <p className="text-zinc-500 mt-1">
              Choose a display name for your Hudson identity.
            </p>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">
                Display Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 h-4 w-4" />
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-zinc-300 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 outline-none text-sm"
                  autoFocus
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleUpdateName}
            disabled={saving || !displayName.trim()}
            className="w-full py-3 rounded-full bg-brand-blue text-white font-semibold text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                Continue <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      )}

      {step === "age" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">
              Age Verification
            </h2>
            <p className="text-zinc-500 mt-1">
              Prove you are over 18 without revealing your date of birth.
            </p>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-brand-blue/10 flex items-center justify-center">
                <Fingerprint className="h-6 w-6 text-brand-blue" />
              </div>
              <div>
                <p className="font-medium text-zinc-900">
                  Reclaim Protocol Verification
                </p>
                <p className="text-sm text-zinc-500">
                  Privacy-preserving age proof using zero-knowledge cryptography
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => handleInitVerification("age")}
              disabled={saving}
              className="flex-1 py-3 rounded-full bg-brand-blue text-white font-semibold text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Start Verification <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
            <button
              onClick={() => setStep("kyc")}
              className="px-6 py-3 rounded-full border border-zinc-200 text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
            >
              Skip
            </button>
          </div>
        </div>
      )}

      {step === "kyc" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">
              KYC Verification
            </h2>
            <p className="text-zinc-500 mt-1">
              Complete Know Your Customer verification for full platform access.
            </p>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-brand-blue/10 flex items-center justify-center">
                <ShieldCheck className="h-6 w-6 text-brand-blue" />
              </div>
              <div>
                <p className="font-medium text-zinc-900">KYC Check</p>
                <p className="text-sm text-zinc-500">
                  Verify your identity for premium event access and higher trust
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => handleInitVerification("kyc")}
              disabled={saving}
              className="flex-1 py-3 rounded-full bg-brand-blue text-white font-semibold text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Start KYC <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
            <button
              onClick={() => setStep("complete")}
              className="px-6 py-3 rounded-full border border-zinc-200 text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
            >
              Skip
            </button>
          </div>
        </div>
      )}

      {step === "complete" && (
        <div className="space-y-6 text-center py-8">
          <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto" />
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">
              You&apos;re all set!
            </h2>
            <p className="text-zinc-500 mt-2">
              Your Hudson identity is ready. You can complete any skipped
              verifications later from the Verification page.
            </p>
          </div>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-8 py-3 rounded-full bg-brand-blue text-white font-semibold text-sm hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      )}
    </div>
  );
}
