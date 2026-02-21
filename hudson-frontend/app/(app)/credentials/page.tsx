"use client";

import { useEffect, useState } from "react";
import {
  credentialApi,
  type Credential,
  type CredentialProof,
} from "@/lib/api";
import {
  ShieldCheck,
  Copy,
  Check,
  Loader2,
  XCircle,
  Clock,
  Ban,
} from "lucide-react";

const proofTypes = [
  { type: "over_18" as const, label: "Over 18" },
  { type: "kyc_approved" as const, label: "KYC Approved" },
  { type: "not_blacklisted" as const, label: "Not Blacklisted" },
];

export default function CredentialsPage() {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingProof, setGeneratingProof] = useState<string | null>(null);
  const [generatedProof, setGeneratedProof] = useState<CredentialProof | null>(
    null
  );
  const [revoking, setRevoking] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadCredentials();
  }, []);

  const loadCredentials = async () => {
    try {
      const data = await credentialApi.list();
      setCredentials(data.credentials);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateProof = async (
    proofType: "over_18" | "kyc_approved" | "not_blacklisted"
  ) => {
    setGeneratingProof(proofType);
    setGeneratedProof(null);
    try {
      const proof = await credentialApi.generateProof(proofType);
      setGeneratedProof(proof);
    } catch (err) {
      console.error("Failed to generate proof:", err);
    } finally {
      setGeneratingProof(null);
    }
  };

  const handleRevoke = async (id: string) => {
    if (!confirm("Are you sure you want to revoke this credential? This action cannot be undone.")) return;
    setRevoking(id);
    try {
      await credentialApi.revoke(id);
      await loadCredentials();
    } finally {
      setRevoking(null);
    }
  };

  const copyProof = () => {
    if (!generatedProof) return;
    navigator.clipboard.writeText(JSON.stringify(generatedProof, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-brand-blue" />
      </div>
    );
  }

  const statusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <Check className="h-3.5 w-3.5 text-emerald-600" />;
      case "revoked":
        return <XCircle className="h-3.5 w-3.5 text-red-500" />;
      case "expired":
        return <Clock className="h-3.5 w-3.5 text-amber-500" />;
      default:
        return null;
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-emerald-50 text-emerald-700";
      case "revoked":
        return "bg-red-50 text-red-700";
      case "expired":
        return "bg-amber-50 text-amber-700";
      default:
        return "bg-zinc-50 text-zinc-700";
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Credentials
        </h1>
        <p className="text-zinc-500 mt-1">
          Manage your verifiable credentials and generate zero-knowledge proofs.
        </p>
      </div>

      {/* Generate Proof Section */}
      <section className="rounded-xl border border-zinc-200 bg-white p-6">
        <h2 className="font-semibold text-zinc-900 mb-1">
          Generate Zero-Knowledge Proof
        </h2>
        <p className="text-sm text-zinc-500 mb-4">
          Create a proof to share specific claims without revealing your full
          identity.
        </p>

        <div className="flex flex-wrap gap-3">
          {proofTypes.map((pt) => (
            <button
              key={pt.type}
              onClick={() => handleGenerateProof(pt.type)}
              disabled={generatingProof === pt.type}
              className="px-4 py-2.5 rounded-lg border border-zinc-200 text-sm font-medium text-zinc-700 hover:border-brand-blue hover:text-brand-blue disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {generatingProof === pt.type ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ShieldCheck className="h-4 w-4" />
              )}
              {pt.label}
            </button>
          ))}
        </div>

        {generatedProof && (
          <div className="mt-4 rounded-lg bg-zinc-50 p-4 border border-zinc-100">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-zinc-900">
                Generated Proof
              </p>
              <button
                onClick={copyProof}
                className="flex items-center gap-1 text-xs text-brand-blue hover:text-blue-700 font-medium transition-colors"
              >
                {copied ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <pre className="text-xs font-mono text-zinc-600 overflow-x-auto whitespace-pre-wrap break-all">
              {JSON.stringify(generatedProof, null, 2)}
            </pre>
          </div>
        )}
      </section>

      {/* Credentials List */}
      <section>
        <h2 className="text-lg font-semibold tracking-tight text-zinc-900 mb-4">
          Your Credentials
        </h2>

        {credentials.length === 0 ? (
          <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center">
            <ShieldCheck className="h-10 w-10 text-zinc-300 mx-auto mb-3" />
            <p className="text-sm text-zinc-500">
              No credentials yet. Complete identity verification to receive
              credentials.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {credentials.map((cred) => (
              <div
                key={cred.id}
                className="rounded-xl border border-zinc-200 bg-white p-5"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-brand-blue/10 flex items-center justify-center shrink-0 mt-0.5">
                      <ShieldCheck className="h-5 w-5 text-brand-blue" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-zinc-900 capitalize">
                          {cred.credential_type.replace("_", " ")} Credential
                        </h3>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(
                            cred.status
                          )}`}
                        >
                          {statusIcon(cred.status)}
                          {cred.status}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-1 font-mono truncate max-w-md">
                        {cred.credential_hash}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-zinc-500">
                        <span>
                          Issued:{" "}
                          {new Date(cred.issued_at).toLocaleDateString()}
                        </span>
                        <span>
                          Expires:{" "}
                          {new Date(cred.expires_at).toLocaleDateString()}
                        </span>
                      </div>
                      {cred.revoked_at && (
                        <p className="text-xs text-red-500 mt-1">
                          Revoked: {new Date(cred.revoked_at).toLocaleDateString()}
                          {cred.revocation_reason && ` — ${cred.revocation_reason}`}
                        </p>
                      )}
                    </div>
                  </div>

                  {cred.status === "active" && (
                    <button
                      onClick={() => handleRevoke(cred.id)}
                      disabled={revoking === cred.id}
                      className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
                    >
                      {revoking === cred.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Ban className="h-3.5 w-3.5" />
                      )}
                      Revoke
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
