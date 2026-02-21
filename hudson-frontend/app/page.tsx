import Image from "next/image";
// Lucide icons (make sure you have @lucide/react installed)
import { IdCard, ShieldCheck, GitMerge, ShoppingCart } from "lucide-react";

const features = [
  {
    icon: <IdCard className="w-5 h-5 text-zinc-700" />,
    title: "Reusable ID verification",
    description:
      "Users don’t have to scan physical ID documents or fill out forms twice. A verified digital ID is issued once and reused across all services and touchpoints, reducing friction, increasing conversion, and streamlining onboarding.",
  },
  {
    icon: <ShieldCheck className="w-5 h-5 text-zinc-700" />,
    title: "Faster and secure authentication",
    description:
      "Replace passwords and OTPs with verified digital IDs. That means faster access, shorter wait times, and stronger protection against SIM swaps, phishing, and spoofing.",
  },
  {
    icon: <GitMerge className="w-5 h-5 text-zinc-700" />,
    title: "Cross-domain identity unification",
    description:
      "Unify identity across siloed IAM systems and business units without merging databases. The same verified identity is recognized across domains, eliminating the need for re-verification.",
  },
  {
    icon: <ShoppingCart className="w-5 h-5 text-zinc-700" />,
    title: "Email Protection",
    description:
      "We protect your email address with a unique, randomly generated identifier. This means you can use our service without worrying about your email being exposed or misused. Your privacy is our priority.",
  },
];

export default function Home() {
  return (
    <>
      {/* First Section */}
      <main className="bg-[#FAFAFA] min-h-screen flex items-center">
        <section className="flex flex-col items-center justify-between w-full mx-auto px-6 py-12">
          <h1 className="text-5xl font-semibold tracking-tight text-zinc-900 leading-[1.1] mb-16 max-w-5xl mx-auto">
            Meet <span className="text-brand-blue">Hudson</span>. The Universal
            Identity Experience.
          </h1>

          <div className="hidden md:block w-full mb-10 max-w-xl mx-auto">
            <Image
              src="/info.svg"
              alt="Hudson Identity Illustration"
              width={1134}
              height={692}
              priority
            />
          </div>

          <p className="text-zinc-600 leading-relaxed mb-10 max-w-xl mx-auto">
            Verify once, use everywhere. Hudson&apos;s decentralized identity
            platform lets users own their data with instant, privacy-preserving
            verification.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-6 w-full max-w-xl mx-auto">
            <button className="bg-brand-blue hover:bg-blue-700 transition-colors text-white px-8 py-3 rounded-full font-semibold text-sm shadow-lg shadow-blue-500/20">
              Get Your Identity
            </button>

            <p className="text-xs text-zinc-400 max-w-45 leading-snug">
              Your favorite app doesn&apos;t support us?{" "}
              <span className="underline decoration-zinc-300 cursor-pointer hover:text-brand-blue transition-colors">
                We&apos;ll talk to them.
              </span>
            </p>
          </div>
        </section>
      </main>

      {/* Second Section */}
      <main className=" py-10 flex items-center bg-[#FAFAFA]">
        <section className="flex flex-col items-center justify-between w-full mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center w-full max-w-5xl mx-auto mb-16">
            <h1 className="text-5xl font-semibold tracking-tight text-zinc-900 leading-[1.1]">
              One unified identity experience
            </h1>
            <button className="bg-brand-blue hover:bg-blue-700 transition-colors text-white px-8 py-3 rounded-full font-semibold text-sm shadow-lg shadow-blue-500/20">
              Get Your Identity
            </button>
          </div>

          {/* Grid of Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-5xl mx-auto">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-[#F4F4F5] p-4 rounded-lg border border-zinc-100"
              >
                <div className="mb-3">{feature.icon}</div>
                <h3 className="text-lg font-semibold tracking-tight text-zinc-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-zinc-600 text-sm leading-relaxed mb-3">
                  {feature.description}
                </p>
                <a
                  href="#"
                  className="text-brand-blue hover:text-blue-700 transition-colors text-sm font-medium inline-flex items-center"
                >
                  Learn more{" "}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-4 h-4 ml-1"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8.25 4.5l7.5 7.5-7.5 7.5"
                    />
                  </svg>
                </a>
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
