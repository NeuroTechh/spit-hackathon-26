"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { ShieldCheck, Loader2, X } from "lucide-react";

export default function ConsentPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const clientId = searchParams.get("client_id") || "";
  const scope = searchParams.get("scope") || "";
  const scopes = scope.split(" ").filter(Boolean);

  // If not logged in, redirect to login (the OAuth flow should have handled this)
  useEffect(() => {
    if (!isPending && !session) {
      router.replace("/login");
    }
  }, [session, isPending, router]);

  const handleConsent = async (accept: boolean) => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/oauth2/consent", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accept, oauth_query: searchParams.toString() }),
      });

      const data = await res.json();

      if (data.redirect && data.uri) {
        window.location.href = data.uri;
      } else if (!accept) {
        // If denied and no redirect, go back to dashboard
        router.push("/dashboard");
      } else {
        setError("Unexpected response from authorization server.");
      }
    } catch {
      setError("Failed to process consent. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-brand-blue" />
      </div>
    );
  }

  const scopeLabels: Record<string, string> = {
    openid: "Verify your identity",
    profile: "Access your name and profile info",
    email: "Access your email address",
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] p-6">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
          <div className="flex items-center justify-center mb-6">
            <div className="h-14 w-14 rounded-xl bg-brand-blue/10 flex items-center justify-center">
              <ShieldCheck className="h-7 w-7 text-brand-blue" />
            </div>
          </div>

          <h1 className="text-xl font-semibold tracking-tight text-zinc-900 text-center mb-1">
            Authorize Application
          </h1>
          <p className="text-sm text-zinc-500 text-center mb-6">
            <span className="font-medium text-zinc-700">{clientId}</span> wants
            to access your Hudson account
          </p>

          {scopes.length > 0 && (
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 mb-6">
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">
                This will allow the application to:
              </p>
              <ul className="space-y-2.5">
                {scopes.map((s) => (
                  <li
                    key={s}
                    className="flex items-center gap-2.5 text-sm text-zinc-700"
                  >
                    <div className="h-1.5 w-1.5 rounded-full bg-brand-blue shrink-0" />
                    {scopeLabels[s] || s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {error && (
            <div className="mb-4 px-4 py-2.5 rounded-lg bg-red-50 border border-red-200">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={() => handleConsent(true)}
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-brand-blue text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Authorize"
              )}
            </button>

            <button
              onClick={() => handleConsent(false)}
              disabled={loading}
              className="w-full py-2.5 rounded-lg border border-zinc-200 text-sm font-medium text-zinc-600 hover:bg-zinc-50 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              <X className="h-4 w-4" />
              Deny
            </button>
          </div>

          <p className="text-xs text-zinc-400 text-center mt-6">
            Signed in as{" "}
            <span className="text-zinc-600">
              {session?.user?.email || "—"}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
