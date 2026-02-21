"use client";

import { useState, useEffect } from "react";
import { Mail, ArrowRight, Loader2 } from "lucide-react";
import { authClient, useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { data: session, isPending } = useSession();

  useEffect(() => {
    if (!isPending && session) {
      router.replace("/dashboard");
    }
  }, [session, isPending, router]);

  if (isPending || session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-brand-blue" />
      </div>
    );
  }

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await authClient.emailOtp.sendVerificationOtp({
        email,
        type: "sign-in",
      });
      setStep("otp");
    } catch {
      setError("Failed to send verification code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await authClient.signIn.emailOtp({
        email,
        otp,
      });

      if (result.error) {
        setError(result.error.message || "Invalid verification code.");
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side: Form */}
      <div className="flex-1 flex items-center justify-center bg-[#FAFAFA] p-6">
        <div className="w-full max-w-md">
          {step === "email" ? (
            <>
              <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 mb-2">
                Welcome to Hudson
              </h1>
              <p className="text-zinc-600 mb-8">
                Enter your email to sign in or create an account.
              </p>

              <form onSubmit={handleSendOTP} className="space-y-6">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-5 h-5" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Your email"
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-zinc-300 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 outline-none transition-colors bg-white"
                    required
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-600">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-brand-blue hover:bg-blue-700 disabled:opacity-50 transition-colors text-white py-3 px-6 rounded-full font-semibold text-sm shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            <>
              <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 mb-2">
                Check your email
              </h1>
              <p className="text-zinc-600 mb-8">
                We sent a 6-digit code to{" "}
                <span className="font-medium text-zinc-900">{email}</span>
              </p>

              <form onSubmit={handleVerifyOTP} className="space-y-6">
                <input
                  type="text"
                  value={otp}
                  onChange={(e) =>
                    setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  placeholder="000000"
                  maxLength={6}
                  className="w-full text-center text-2xl font-mono tracking-[0.5em] py-4 rounded-lg border border-zinc-300 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 outline-none transition-colors bg-white"
                  autoFocus
                  required
                />

                {error && (
                  <p className="text-sm text-red-600">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="w-full bg-brand-blue hover:bg-blue-700 disabled:opacity-50 transition-colors text-white py-3 px-6 rounded-full font-semibold text-sm shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Verify"
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStep("email");
                    setOtp("");
                    setError("");
                  }}
                  className="w-full text-sm text-zinc-500 hover:text-zinc-700 transition-colors"
                >
                  Use a different email
                </button>
              </form>
            </>
          )}

          <p className="text-xs text-zinc-500 mt-8 text-center">
            By continuing, you agree to our{" "}
            <a href="#" className="text-brand-blue hover:underline">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="text-brand-blue hover:underline">
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </div>

      {/* Right Side: Brand panel */}
      <div className="hidden md:flex flex-1 items-center justify-center bg-brand-blue text-white p-12 m-2 rounded-4xl">
        <div className="max-w-md">
          <h2 className="text-4xl font-semibold tracking-tight mb-6">
            One identity, endless possibilities
          </h2>
          <p className="text-lg/6 text-blue-100">
            Hudson lets you verify once and use your identity everywhere —
            securely, seamlessly, and without friction.
          </p>
        </div>
      </div>
    </div>
  );
}
