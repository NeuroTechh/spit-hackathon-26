"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { verifyApi } from "@/lib/api";
import {
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import Link from "next/link";

export default function PublicVerifyPage() {
  const params = useParams();
  const hash = params.hash as string;
  const [result, setResult] = useState<{
    isValid: boolean;
    onChain: Record<string, unknown>;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    verifyApi
      .credential(hash)
      .then((data) => setResult(data as { isValid: boolean; onChain: Record<string, unknown> }))
      .catch(() => setError("Failed to verify credential"))
      .finally(() => setLoading(false));
  }, [hash]);

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="h-12 w-12 rounded-xl bg-brand-blue flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Credential Verification
          </h1>
          <p className="text-zinc-500 mt-1 text-sm">
            Public on-chain credential check
          </p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-6">
          {loading ? (
            <div className="flex flex-col items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-brand-blue mb-3" />
              <p className="text-sm text-zinc-500">
                Verifying credential on-chain...
              </p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center py-8">
              <XCircle className="h-10 w-10 text-red-400 mb-3" />
              <p className="text-sm text-zinc-700 font-medium">
                Verification Failed
              </p>
              <p className="text-xs text-zinc-500 mt-1">{error}</p>
            </div>
          ) : result ? (
            <div className="space-y-4">
              <div className="flex flex-col items-center py-4">
                {result.isValid ? (
                  <>
                    <CheckCircle2 className="h-12 w-12 text-emerald-500 mb-3" />
                    <p className="text-lg font-semibold text-emerald-700">
                      Valid Credential
                    </p>
                    <p className="text-sm text-zinc-500 mt-1">
                      This credential is verified on-chain.
                    </p>
                  </>
                ) : (
                  <>
                    <XCircle className="h-12 w-12 text-red-400 mb-3" />
                    <p className="text-lg font-semibold text-red-600">
                      Invalid Credential
                    </p>
                    <p className="text-sm text-zinc-500 mt-1">
                      This credential could not be verified.
                    </p>
                  </>
                )}
              </div>

              <div className="border-t border-zinc-100 pt-4 space-y-2">
                <p className="text-xs text-zinc-500">Credential Hash</p>
                <code className="block text-xs font-mono text-zinc-600 bg-zinc-50 px-3 py-2 rounded-lg break-all">
                  {hash}
                </code>
              </div>

              {result.onChain && (
                <div className="border-t border-zinc-100 pt-4">
                  <p className="text-xs text-zinc-500 mb-2">
                    On-Chain Data
                  </p>
                  <pre className="text-xs font-mono text-zinc-600 bg-zinc-50 px-3 py-2 rounded-lg overflow-x-auto whitespace-pre-wrap break-all">
                    {JSON.stringify(result.onChain, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ) : null}
        </div>

        <div className="text-center mt-6">
          <Link
            href="/"
            className="text-sm text-brand-blue hover:text-blue-700 font-medium transition-colors"
          >
            Back to Hudson
          </Link>
        </div>
      </div>
    </div>
  );
}
