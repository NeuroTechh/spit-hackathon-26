"use client";
import { useState } from "react";
import { User, Phone, Camera, IdCard, Smile } from "lucide-react";

export default function Onboarding() {
  const [step, setStep] = useState(1);

  const handleNext = () => {
    setStep(2);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] p-6">
      {/* Container for fade transition */}
      <div className="w-full max-w-md transition-opacity duration-300 ease-in-out">
        {/* Step 1: Name and Phone */}
        {step === 1 && (
          <div className=" space-y-8">
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
              Welcome to <span className="text-brand-blue">Hudson</span>
            </h1>
            <p className="text-zinc-600">
              Let’s get you started. Enter your name and phone number.
            </p>

            <form className="space-y-6">
              <div className="space-y-4">
                <div className="relative">
                  <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-zinc-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Full Name"
                    className="w-full pl-12 pr-4 py-3 rounded-lg border border-zinc-300 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 outline-none transition-colors"
                    required
                  />
                </div>

                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-zinc-400 w-5 h-5" />
                  <input
                    type="tel"
                    placeholder="Phone Number"
                    className="w-full pl-12 pr-4 py-3 rounded-lg border border-zinc-300 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 outline-none transition-colors"
                    required
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleNext}
                className="w-full bg-brand-blue hover:bg-blue-700 transition-colors text-white py-3 px-6 rounded-full font-semibold text-sm shadow-lg shadow-blue-500/20"
              >
                Next
              </button>
            </form>
          </div>
        )}

        {/* Step 2: KYC Verification */}
        {step === 2 && (
          <div className="space-y-8">
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
              Let’s verify your identity
            </h1>
            <p className="text-zinc-600">
              Please submit the following to verify your profile.
            </p>

            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-brand-blue/10 text-brand-blue">
                    <IdCard className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-medium text-zinc-900">
                      Upload proof of identity
                    </h3>
                    <p className="text-sm text-zinc-500">
                      Submit a valid government ID
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-brand-blue/10 text-brand-blue">
                    <Camera className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-medium text-zinc-900">Take a selfie</h3>
                    <p className="text-sm text-zinc-500">
                      Match your face to your ID photo
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="button"
              className="w-full bg-brand-blue hover:bg-blue-700 transition-colors text-white py-3 px-6 rounded-full font-semibold text-sm shadow-lg shadow-blue-500/20"
            >
              Start Verification
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
