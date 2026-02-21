"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { RACE_IMAGE } from "@/data/events";

export default function LoginPage() {
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      const next = document.getElementById(`otp-${index + 1}`);
      next?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prev = document.getElementById(`otp-${index - 1}`);
      prev?.focus();
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

      {/* Right - Form */}
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
          <div className="w-full max-w-sm">
            {step === "email" ? (
              <>
                <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight mb-1">
                  Sign in
                </h1>
                <p className="text-zinc-500 text-sm mb-8">
                  Enter your email and we&apos;ll send you a verification code
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                      Email address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="racer@example.com"
                      className="w-full px-3.5 py-2.5 border border-zinc-200 rounded-lg text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-300 transition-all"
                    />
                  </div>

                  <button
                    onClick={() => email && setStep("otp")}
                    className={`w-full py-2.5 rounded-full text-sm font-semibold transition-colors ${
                      email
                        ? "bg-zinc-900 text-white hover:bg-zinc-800"
                        : "bg-zinc-100 text-zinc-400 cursor-not-allowed"
                    }`}
                  >
                    Continue
                  </button>
                </div>

                <p className="text-zinc-400 text-xs text-center mt-8">
                  By continuing, you agree to our Terms of Service
                  <br />
                  and Privacy Policy.
                </p>
              </>
            ) : (
              <>
                <button
                  onClick={() => setStep("email")}
                  className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 transition-colors mb-6"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>

                <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight mb-1">
                  Check your email
                </h1>
                <p className="text-zinc-500 text-sm mb-8">
                  We sent a 6-digit code to{" "}
                  <span className="text-zinc-900 font-medium">{email}</span>
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-2">
                      Verification code
                    </label>
                    <div className="flex gap-2 justify-between">
                      {otp.map((digit, i) => (
                        <input
                          key={i}
                          id={`otp-${i}`}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpChange(i, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(i, e)}
                          className="w-12 h-13 text-center text-lg font-semibold border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-300 transition-all"
                        />
                      ))}
                    </div>
                  </div>

                  <button
                    className={`w-full py-2.5 rounded-full text-sm font-semibold transition-colors ${
                      otp.every((d) => d)
                        ? "bg-zinc-900 text-white hover:bg-zinc-800"
                        : "bg-zinc-100 text-zinc-400 cursor-not-allowed"
                    }`}
                  >
                    Verify & Sign In
                  </button>
                </div>

                <button className="w-full text-center text-sm text-zinc-500 hover:text-zinc-900 transition-colors mt-6">
                  Didn&apos;t get the code? Resend
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
