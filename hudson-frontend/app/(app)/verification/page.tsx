"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { identityApi, credentialApi, type Credential, type VerificationInit } from "@/lib/api";
import {
  Fingerprint,
  ShieldCheck,
  UserCheck,
  Ban,
  Loader2,
  CheckCircle2,
  Upload,
  X,
  FileText,
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

const docTypeLabels: Record<string, string> = {
  passport: "Passport",
  aadhaar: "Aadhaar Card",
  drivers_license: "Driver's License",
  national_id: "National ID",
};

type ActiveVerification = {
  type: VerificationType;
  initData: VerificationInit;
};

export default function VerificationPage() {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [initiating, setInitiating] = useState<VerificationType | null>(null);
  const [activeVerification, setActiveVerification] = useState<ActiveVerification | null>(null);
  const [selectedDocType, setSelectedDocType] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadCredentials = useCallback(async () => {
    try {
      const data = await credentialApi.list();
      setCredentials(data.credentials);
    } catch {
      // Credentials may not exist yet
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
    setSuccessMessage("");
    try {
      const result = await identityApi.initVerification(type);
      setActiveVerification({ type, initData: result });
      setSelectedDocType(result.suggestedDocType);
      setSelectedFile(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to start verification"
      );
    } finally {
      setInitiating(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError("");
    }
  };

  const handleSubmitDocument = async () => {
    if (!activeVerification || !selectedFile || !selectedDocType) return;

    setSubmitting(true);
    setError("");
    try {
      const result = await identityApi.submitDocument(
        activeVerification.initData.requestId,
        activeVerification.type,
        selectedDocType,
        selectedFile
      );

      setSuccessMessage(
        `Verification successful! Confidence: ${result.attestation.confidenceScore}%. ${
          result.onChainTxHash ? "Registered on-chain." : ""
        }`
      );
      setActiveVerification(null);
      setSelectedFile(null);
      setSelectedDocType("");
      await loadCredentials();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Document verification failed"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const cancelVerification = () => {
    setActiveVerification(null);
    setSelectedFile(null);
    setSelectedDocType("");
    setError("");
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
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Identity Verification
        </h1>
        <p className="text-zinc-500 mt-1">
          Upload a document to verify your identity. Only hashes are stored — your data stays private.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50/50 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <p className="text-sm text-emerald-700">{successMessage}</p>
        </div>
      )}

      {/* Document Upload Panel */}
      {activeVerification && (
        <div className="rounded-xl border border-brand-blue/20 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-brand-blue/10 flex items-center justify-center">
                <Upload className="h-5 w-5 text-brand-blue" />
              </div>
              <div>
                <h3 className="font-semibold text-zinc-900">
                  Upload Document
                </h3>
                <p className="text-xs text-zinc-500">
                  {activeVerification.type.replace("_", " ")} verification
                </p>
              </div>
            </div>
            <button
              onClick={cancelVerification}
              className="p-2 rounded-lg hover:bg-zinc-100 transition-colors"
            >
              <X className="h-4 w-4 text-zinc-400" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Document Type Selector */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">
                Document Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                {activeVerification.initData.acceptedDocTypes.map((dt) => (
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

            {/* File Upload */}
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
                  className="w-full px-4 py-8 rounded-lg border-2 border-dashed border-zinc-300 hover:border-brand-blue/40 transition-colors text-center"
                >
                  <Upload className="h-6 w-6 text-zinc-400 mx-auto mb-2" />
                  <p className="text-sm text-zinc-600">
                    Click to upload document
                  </p>
                  <p className="text-xs text-zinc-400 mt-1">
                    JPEG, PNG, WebP, or PDF — Max 5MB
                  </p>
                </button>
              )}
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmitDocument}
              disabled={submitting || !selectedFile || !selectedDocType}
              className="w-full py-3 rounded-full bg-brand-blue text-white font-semibold text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verifying document...
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  Submit for Verification
                </>
              )}
            </button>

            <p className="text-xs text-zinc-400 text-center">
              Your document is processed by the attestation service. Only a hash is stored — raw data is never saved.
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
                          <Upload className="h-3 w-3" />
                          Upload Required
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
                          <p className="text-xs text-zinc-400 font-mono truncate max-w-md">
                            Tx: {credential.on_chain_tx_hash}
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
