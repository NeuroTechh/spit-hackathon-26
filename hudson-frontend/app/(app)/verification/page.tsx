"use client";

import { useEffect, useState, useCallback } from "react";
import { identityApi, credentialApi, type Credential } from "@/lib/api";
import {
  Fingerprint,
  ShieldCheck,
  UserCheck,
  Ban,
  Loader2,
  CheckCircle2,
  ExternalLink,
  QrCode,
  X,
  RefreshCw,
} from "lucide-react";

type VerificationType = "age" | "kyc" | "blacklist_check";

const verificationTypes: {
  type: VerificationType;
  title: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    type: "age",
    title: "Age Verification",
    description:
      "Prove you are over 18 without revealing your exact date of birth. Required for age-restricted events.",
    icon: <UserCheck className="h-5 w-5" />,
  },
  {
    type: "kyc",
    title: "KYC Verification",
    description:
      "Complete Know Your Customer verification to access the full platform and premium events.",
    icon: <ShieldCheck className="h-5 w-5" />,
  },
  {
    type: "blacklist_check",
    title: "Blacklist Check",
    description:
      "Verify you are not on any restricted lists. Required for certain high-security events.",
    icon: <Ban className="h-5 w-5" />,
  },
];

type ActiveVerification = {
  type: VerificationType;
  requestId: string;
  requestUrl: string;
  statusUrl: string;
};

export default function VerificationPage() {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [initiating, setInitiating] = useState<VerificationType | null>(null);
  const [activeVerification, setActiveVerification] =
    useState<ActiveVerification | null>(null);
  const [polling, setPolling] = useState(false);
  const [error, setError] = useState("");

  const loadCredentials = useCallback(async () => {
    try {
      const data = await credentialApi.list();
      setCredentials(data.credentials);
    } catch {
      // Silently fail — credentials may not exist yet
    }
  }, []);

  useEffect(() => {
    loadCredentials().finally(() => setLoading(false));
  }, [loadCredentials]);

  const getCredentialForType = (type: VerificationType) =>
    credentials.find(
      (c) => c.credential_type === type && c.status === "active"
    );

  const handleInitVerification = async (type: VerificationType) => {
    setInitiating(type);
    setError("");
    try {
      const result = await identityApi.initVerification(type);
      setActiveVerification({
        type,
        requestId: result.requestId,
        requestUrl: (result as unknown as { requestUrl: string }).requestUrl,
        statusUrl: (result as unknown as { statusUrl: string }).statusUrl,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to start verification"
      );
    } finally {
      setInitiating(null);
    }
  };

  // Poll the status URL for proof completion
  useEffect(() => {
    if (!activeVerification?.statusUrl) return;

    setPolling(true);
    const interval = setInterval(async () => {
      try {
        const res = await fetch(activeVerification.statusUrl);
        if (!res.ok) return;

        const data = await res.json();

        // Reclaim status API returns session with proofs when complete
        if (data?.session?.proofs && data.session.proofs.length > 0) {
          clearInterval(interval);
          setPolling(false);

          // Submit the proof to our backend callback
          try {
            const proof = data.session.proofs[0];
            await identityApi.submitCallback(activeVerification.requestId, {
              verificationType: activeVerification.type,
              proof: {
                provider: proof.provider || "",
                parameters: proof.parameters || "",
                context: proof.claimData?.context || proof.context || "",
                extractedValues:
                  proof.claimData?.extractedValues ||
                  proof.extractedValues ||
                  {},
                signatures: proof.signatures || [],
                timestamp: proof.claimData?.timestampS
                  ? Number(proof.claimData.timestampS) * 1000
                  : Date.now(),
              },
            });

            // Refresh credentials
            await loadCredentials();
            setActiveVerification(null);
          } catch (err) {
            setError(
              err instanceof Error
                ? err.message
                : "Failed to submit verification proof"
            );
            setActiveVerification(null);
          }
        }
      } catch {
        // Status endpoint not ready yet, keep polling
      }
    }, 3000);

    return () => {
      clearInterval(interval);
      setPolling(false);
    };
  }, [activeVerification, loadCredentials]);

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
          Identity Verification
        </h1>
        <p className="text-zinc-500 mt-1">
          Verify your identity using Reclaim Protocol for privacy-preserving
          credentials.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50/50 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Active Reclaim Verification Modal */}
      {activeVerification && (
        <div className="rounded-xl border border-brand-blue/20 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-brand-blue/10 flex items-center justify-center">
                <QrCode className="h-5 w-5 text-brand-blue" />
              </div>
              <div>
                <h3 className="font-semibold text-zinc-900">
                  Complete Verification
                </h3>
                <p className="text-xs text-zinc-500">
                  {activeVerification.type.replace("_", " ")} verification via
                  Reclaim Protocol
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveVerification(null)}
              className="p-2 rounded-lg hover:bg-zinc-100 transition-colors"
            >
              <X className="h-4 w-4 text-zinc-400" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="rounded-lg bg-zinc-50 p-4 text-center">
              <p className="text-sm text-zinc-600 mb-4">
                Click the button below to open the Reclaim verification flow.
                Complete the verification on the Reclaim page, then return here.
              </p>

              <a
                href={activeVerification.requestUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-brand-blue text-white font-semibold text-sm hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20"
              >
                <ExternalLink className="h-4 w-4" />
                Open Reclaim Verification
              </a>
            </div>

            {polling && (
              <div className="flex items-center justify-center gap-2 py-3">
                <RefreshCw className="h-4 w-4 text-brand-blue animate-spin" />
                <p className="text-sm text-zinc-500">
                  Waiting for verification to complete...
                </p>
              </div>
            )}

            <p className="text-xs text-zinc-400 text-center">
              Request ID: {activeVerification.requestId}
            </p>
          </div>
        </div>
      )}

      {/* Verification Cards */}
      <div className="space-y-4">
        {verificationTypes.map((v) => {
          const credential = getCredentialForType(v.type);
          const isVerified = !!credential;
          const isActive = activeVerification?.type === v.type;

          return (
            <div
              key={v.type}
              className={`rounded-xl border bg-white p-6 ${
                isActive ? "border-brand-blue/30" : "border-zinc-200"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div
                    className={`h-11 w-11 rounded-lg flex items-center justify-center shrink-0 ${
                      isVerified
                        ? "bg-emerald-50 text-emerald-600"
                        : isActive
                        ? "bg-brand-blue/10 text-brand-blue"
                        : "bg-zinc-50 text-zinc-400"
                    }`}
                  >
                    {v.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-zinc-900">
                        {v.title}
                      </h3>
                      {isVerified && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                          <CheckCircle2 className="h-3 w-3" />
                          Verified
                        </span>
                      )}
                      {isActive && !isVerified && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-brand-blue">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          In Progress
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-zinc-500 mt-1 max-w-lg">
                      {v.description}
                    </p>

                    {isVerified && credential && (
                      <div className="mt-3 space-y-1">
                        <p className="text-xs text-zinc-400">
                          Issued:{" "}
                          {new Date(credential.issued_at).toLocaleDateString()}
                          {" · "}
                          Expires:{" "}
                          {new Date(credential.expires_at).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-zinc-400 font-mono truncate max-w-md">
                          Hash: {credential.credential_hash}
                        </p>
                        {credential.on_chain_tx_hash && (
                          <p className="text-xs text-zinc-400 font-mono truncate max-w-md flex items-center gap-1">
                            Tx: {credential.on_chain_tx_hash}
                            <ExternalLink className="h-3 w-3 shrink-0" />
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {!isVerified && !isActive && (
                  <button
                    onClick={() => handleInitVerification(v.type)}
                    disabled={
                      initiating === v.type || activeVerification !== null
                    }
                    className="shrink-0 px-5 py-2.5 rounded-full bg-brand-blue text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                  >
                    {initiating === v.type ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Fingerprint className="h-4 w-4" />
                    )}
                    Verify
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
