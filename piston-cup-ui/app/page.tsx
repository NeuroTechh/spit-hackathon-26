import { Navbar } from "@/components/navbar";
import { Hero } from "@/components/hero";
import { CategorySection } from "@/components/category-section";
import { Footer } from "@/components/footer";
import { RaceCard } from "@/components/race-card";
import { events } from "@/data/events";
import Link from "next/link";
import { IdCard, ShieldCheck, GitMerge, Zap } from "lucide-react";

const featuredEvents = events.filter(
  (e) => e.status === "featured" || e.status === "selling-fast"
);
const upcomingEvents = events.filter((e) => e.status === "upcoming");

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <Navbar />
      <Hero />

      {/* Featured Races */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">
                Featured Races
              </h2>
              <p className="text-zinc-500 mt-1 text-sm">
                Don&apos;t miss these headline events
              </p>
            </div>
            <Link
              href="/events"
              className="text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
            >
              See all &rarr;
            </Link>
          </div>

          <div className="flex gap-5 overflow-x-auto no-scrollbar pb-2">
            {featuredEvents.map((event) => (
              <div key={event.id} className="w-80 shrink-0">
                <RaceCard event={event} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <CategorySection />

      {/* Upcoming Events */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">
                Upcoming Events
              </h2>
              <p className="text-zinc-500 mt-1 text-sm">
                Secure your pass before they sell out
              </p>
            </div>
            <Link
              href="/events"
              className="text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
            >
              Browse all &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingEvents.slice(0, 6).map((event) => (
              <RaceCard key={event.id} event={event} />
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
            <h2 className="text-3xl font-semibold tracking-tight text-zinc-900 leading-[1.1]">
              One verified pass, unlimited access
            </h2>
            <Link
              href="/login"
              className="bg-zinc-900 hover:bg-zinc-800 transition-colors text-white px-6 py-2.5 rounded-full font-medium text-sm"
            >
              Get Your Pass
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                icon: <IdCard className="w-5 h-5 text-zinc-700" />,
                title: "Get Verified",
                desc: "Complete a simple identity check to prove you meet event requirements. Verify once, use everywhere.",
              },
              {
                icon: <ShieldCheck className="w-5 h-5 text-zinc-700" />,
                title: "Earn Your Pass",
                desc: "Receive a tamper-proof digital pass — your exclusive credential for accessing Piston Cup events.",
              },
              {
                icon: <GitMerge className="w-5 h-5 text-zinc-700" />,
                title: "Build Reputation",
                desc: "Attend events, check in on time, and grow your standing in the community over time.",
              },
              {
                icon: <Zap className="w-5 h-5 text-zinc-700" />,
                title: "Access More",
                desc: "Higher reputation unlocks premium events, VIP areas, and exclusive perks across the platform.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-[#F4F4F5] p-4 rounded-lg border border-zinc-100"
              >
                <div className="mb-3">{item.icon}</div>
                <h3 className="text-lg font-semibold tracking-tight text-zinc-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-zinc-600 text-sm leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-6">
          <div className="bg-zinc-900 rounded-lg p-10 sm:p-14">
            <h2 className="text-3xl sm:text-4xl font-semibold text-white leading-[1.1] tracking-tight mb-4">
              Ready to experience the Piston Cup?
            </h2>
            <p className="text-zinc-400 text-base mb-8 leading-relaxed max-w-md">
              Create your verified identity, get your first pass, and join
              thousands of racing fans at the most exclusive events.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/login"
                className="bg-white text-zinc-900 px-6 py-3 rounded-full text-sm font-semibold hover:bg-zinc-100 transition-colors"
              >
                Get Started &rarr;
              </Link>
              <Link
                href="/events"
                className="text-white text-sm font-medium hover:text-zinc-300 transition-colors py-3"
              >
                Browse Events
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
