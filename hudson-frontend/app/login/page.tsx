import { Mail } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left Side: Login Form */}
      <div className="flex-1 flex items-center justify-center bg-[#FAFAFA] p-6">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 mb-2">
            Welcome back
          </h1>
          <p className="text-zinc-600 mb-8">
            Enter your email to continue with Hudson.
          </p>

          <form className="space-y-6">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 w-5 h-5" />
              <input
                type="email"
                placeholder="Your email"
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-zinc-300 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 outline-none transition-colors"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-brand-blue hover:bg-blue-700 transition-colors text-white py-3 px-6 rounded-full font-semibold text-sm shadow-lg shadow-blue-500/20"
            >
              Continue
            </button>
          </form>

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

      {/* Right Side: Brand Blue Background */}
      <div className="hidden md:flex flex-1 items-center justify-center bg-brand-blue text-white p-12 m-2 rounded-4xl">
        <div className="max-w-md">
          <h2 className="text-4xl font-semibold tracking-tight mb-6">
            One identity, endless possibilities
          </h2>
          <p className="text-lg/6 text-blue-100">
            Hudson lets you verify once and use your identity
            everywhere securely, seamlessly, and without friction.
          </p>
        </div>
      </div>
    </div>
  );
}
