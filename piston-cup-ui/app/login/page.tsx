"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { RACE_IMAGE } from "@/data/events";
import { authClient } from "@/lib/auth-client";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignIn = async () => {
    setLoading(true);
    setError("");
    try {
      await authClient.signIn.oauth2({
        providerId: "hudson",
        callbackURL: "http://localhost:3005/events",
      });
    } catch (err) {
      setError("Failed to start sign-in. Please try again.");
      console.error("Sign-in failed:", err);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left - Image */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <Image
          src={RACE_IMAGE}
          alt="Racing"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative h-full flex flex-col justify-between p-10">
          <Link
            href="/"
            className="text-white font-semibold tracking-tight text-lg"
          >
            Piston Cup
          </Link>
          <div>
            <h2 className="text-3xl font-semibold text-white leading-[1.1] tracking-tight mb-3">
              Your verified pass
              <br />
              to the fast lane.
            </h2>
            <p className="text-zinc-300 text-sm leading-relaxed max-w-sm">
              Join thousands of verified racing fans with a secure digital
              identity. One pass, unlimited races.
            </p>
          </div>
          <p className="text-zinc-500 text-xs">
            Powered by Hudson Identity Protocol
          </p>
        </div>
      </div>

      {/* Right - Sign in */}
      <div className="flex-1 flex flex-col">
        <div className="lg:hidden px-6 py-4 border-b border-zinc-100">
          <Link
            href="/"
            className="font-semibold text-zinc-900 tracking-tight"
          >
            Piston Cup
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-sm text-center">
            <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight mb-1">
              Sign in
            </h1>
            <p className="text-zinc-500 text-sm mb-8">
              Authenticate with your Hudson identity to access Piston Cup
            </p>

            {error && (
              <div className="mb-4 px-4 py-2.5 rounded-lg bg-red-50 border border-red-200">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <button
              onClick={handleSignIn}
              disabled={loading}
              className="w-full py-2.5 rounded-full text-sm font-semibold bg-zinc-900 text-white hover:bg-zinc-800 transition-colors disabled:opacity-50"
            >
              {loading ? "Redirecting..." : "Continue with Hudson"}
            </button>

            <p className="text-zinc-400 text-xs text-center mt-8">
              By continuing, you agree to our Terms of Service
              <br />
              and Privacy Policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
