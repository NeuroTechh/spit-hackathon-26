"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { userApi, identityApi, type UserProfile, type VerificationInit } from "@/lib/api";
import {
  User,
  Fingerprint,
  ShieldCheck,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Upload,
  FileText,
  X,
} from "lucide-react";

type Step = "profile" | "age" | "kyc" | "complete";

const docTypeLabels: Record<string, string> = {
  passport: "Passport",
  aadhaar: "Aadhaar Card",
  drivers_license: "Driver's License",
  national_id: "National ID",
};

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("profile");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Verification state
  const [verificationInit, setVerificationInit] = useState<VerificationInit | null>(null);
  const [selectedDocType, setSelectedDocType] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    setError("");
    setSaving(true);
    try {
      const result = await identityApi.initVerification(type);
      setVerificationInit(result);
      setSelectedDocType(result.suggestedDocType);
      setSelectedFile(null);
    } catch {
      setError("Failed to initialize verification. You can complete this later from the Verification page.");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitDocument = async (type: "age" | "kyc") => {
    if (!verificationInit || !selectedFile || !selectedDocType) return;

    setSubmitting(true);
    setError("");
    try {
      await identityApi.submitDocument(
        verificationInit!.requestId,
        type,
        selectedDocType,
        selectedFile!
      );
      setVerificationInit(null);
      setSelectedFile(null);
      setSelectedDocType("");
      if (type === "age") setStep("kyc");
      else setStep("complete");
    } catch {
      setError("Verification failed. You can try again later from the Verification page.");
      setVerificationInit(null);
      setSelectedFile(null);
      if (type === "age") setStep("kyc");
      else setStep("complete");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = (type: "age" | "kyc") => {
    setVerificationInit(null);
    setSelectedFile(null);
    setSelectedDocType("");
    setError("");
    if (type === "age") setStep("kyc");
    else setStep("complete");
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

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50/50 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Step: Profile */}
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

      {/* Step: Age Verification */}
      {step === "age" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">
              Age Verification
            </h2>
            <p className="text-zinc-500 mt-1">
              Upload a document to prove you are over 18.
            </p>
          </div>

          {!verificationInit ? (
            <>
              <div className="rounded-xl border border-zinc-200 bg-white p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-brand-blue/10 flex items-center justify-center">
                    <Fingerprint className="h-6 w-6 text-brand-blue" />
                  </div>
                  <div>
                    <p className="font-medium text-zinc-900">
                      Document Verification
                    </p>
                    <p className="text-sm text-zinc-500">
                      Privacy-preserving age proof — only a hash is stored
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
                  onClick={() => handleSkip("age")}
                  className="px-6 py-3 rounded-full border border-zinc-200 text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
                >
                  Skip
                </button>
              </div>
            </>
          ) : (
            <DocUploadForm
              verificationInit={verificationInit}
              selectedDocType={selectedDocType}
              setSelectedDocType={setSelectedDocType}
              selectedFile={selectedFile}
              setSelectedFile={setSelectedFile}
              fileInputRef={fileInputRef}
              submitting={submitting}
              onSubmit={() => handleSubmitDocument("age")}
              onSkip={() => handleSkip("age")}
            />
          )}
        </div>
      )}

      {/* Step: KYC Verification */}
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

          {!verificationInit ? (
            <>
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
                  onClick={() => handleSkip("kyc")}
                  className="px-6 py-3 rounded-full border border-zinc-200 text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
                >
                  Skip
                </button>
              </div>
            </>
          ) : (
            <DocUploadForm
              verificationInit={verificationInit}
              selectedDocType={selectedDocType}
              setSelectedDocType={setSelectedDocType}
              selectedFile={selectedFile}
              setSelectedFile={setSelectedFile}
              fileInputRef={fileInputRef}
              submitting={submitting}
              onSubmit={() => handleSubmitDocument("kyc")}
              onSkip={() => handleSkip("kyc")}
            />
          )}
        </div>
      )}

      {/* Step: Complete */}
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

function DocUploadForm({
  verificationInit,
  selectedDocType,
  setSelectedDocType,
  selectedFile,
  setSelectedFile,
  fileInputRef,
  submitting,
  onSubmit,
  onSkip,
}: {
  verificationInit: VerificationInit;
  selectedDocType: string;
  setSelectedDocType: (v: string) => void;
  selectedFile: File | null;
  setSelectedFile: (f: File | null) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  submitting: boolean;
  onSubmit: () => void;
  onSkip: () => void;
}) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1.5">
            Document Type
          </label>
          <div className="grid grid-cols-2 gap-2">
            {verificationInit.acceptedDocTypes.map((dt) => (
              <button
                key={dt}
                type="button"
                onClick={() => setSelectedDocType(dt)}
                className={`px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors text-left ${
                  selectedDocType === dt
                    ? "border-brand-blue bg-brand-blue/5 text-brand-blue"
                    : "border-zinc-200 text-zinc-600 hover:border-zinc-300"
                }`}
              >
                {docTypeLabels[dt] || dt}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1.5">
            Document File
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            onChange={handleFileChange}
            className="hidden"
          />
          {selectedFile ? (
            <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-zinc-200 bg-zinc-50">
              <FileText className="h-5 w-5 text-brand-blue shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-zinc-900 font-medium truncate">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-zinc-500">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="p-1 rounded hover:bg-zinc-200 transition-colors"
              >
                <X className="h-4 w-4 text-zinc-400" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full px-4 py-6 rounded-lg border-2 border-dashed border-zinc-300 hover:border-brand-blue/40 transition-colors text-center"
            >
              <Upload className="h-5 w-5 text-zinc-400 mx-auto mb-1" />
              <p className="text-sm text-zinc-600">Click to upload</p>
              <p className="text-xs text-zinc-400 mt-0.5">
                JPEG, PNG, WebP, or PDF — Max 5MB
              </p>
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onSubmit}
          disabled={submitting || !selectedFile || !selectedDocType}
          className="flex-1 py-3 rounded-full bg-brand-blue text-white font-semibold text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Verifying...
            </>
          ) : (
            <>
              Submit <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
        <button
          onClick={onSkip}
          disabled={submitting}
          className="px-6 py-3 rounded-full border border-zinc-200 text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
        >
          Skip
        </button>
      </div>
    </div>
  );
}
