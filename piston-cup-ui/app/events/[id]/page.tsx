import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { RaceCard } from "@/components/race-card";
import { events, RACE_IMAGE } from "@/data/events";
import {
  Calendar,
  MapPin,
  Clock,
  Users,
  ChevronLeft,
  CheckCircle2,
} from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EventDetailPage({ params }: PageProps) {
  const { id } = await params;
  const event = events.find((e) => e.id === id);

  if (!event) notFound();

  const relatedEvents = events
    .filter((e) => e.id !== event.id && e.category === event.category)
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-zinc-950 h-72 sm:h-96">
        <Image
          src={RACE_IMAGE}
          alt={event.title}
          fill
          className="object-cover opacity-50"
          priority
        />
        <div className="relative max-w-6xl mx-auto px-6 h-full flex flex-col justify-end pb-10">
          <Link
            href="/events"
            className="inline-flex items-center gap-1 text-zinc-400 hover:text-white text-sm mb-6 transition-colors w-fit"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to events
          </Link>

          <div className="flex flex-wrap gap-2 mb-3">
            {event.isNight && (
              <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-white/10 text-white backdrop-blur-sm">
                Night Race
              </span>
            )}
            <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-white/10 text-white backdrop-blur-sm capitalize">
              {event.category.replace("-", " ")}
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-semibold text-white leading-[1.1] tracking-tight max-w-2xl">
            {event.title}
          </h1>
          <p className="text-zinc-400 mt-2 max-w-md text-sm sm:text-base">
            {event.subtitle}
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main */}
            <div className="lg:col-span-2 space-y-8">
              <div>
                <h2 className="text-lg font-semibold text-zinc-900 tracking-tight mb-3">
                  About This Event
                </h2>
                <p className="text-zinc-600 text-sm leading-relaxed">
                  {event.description}
                </p>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-zinc-900 tracking-tight mb-3">
                  Highlights
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {event.highlights.map((h) => (
                    <div
                      key={h}
                      className="flex items-start gap-2.5 p-3 rounded-lg bg-[#F4F4F5] border border-zinc-100"
                    >
                      <CheckCircle2 className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                      <span className="text-sm text-zinc-700">{h}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-zinc-900 tracking-tight mb-3">
                  Requirements
                </h2>
                <div className="flex flex-wrap gap-2">
                  {event.requirements.map((req) => (
                    <span
                      key={req}
                      className="px-3 py-1.5 rounded-full bg-[#F4F4F5] text-sm text-zinc-600 border border-zinc-100"
                    >
                      {req}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-20 space-y-4">
                <div className="rounded-lg border border-zinc-100 bg-white p-5">
                  <h3 className="font-semibold text-zinc-900 text-base mb-1">
                    Race Pass
                  </h3>
                  <p className="text-xs text-zinc-400 mb-5">
                    Verified digital credential
                  </p>

                  <div className="space-y-3 mb-5">
                    <div className="flex items-center gap-2.5 text-sm">
                      <Calendar className="w-4 h-4 text-zinc-400" />
                      <span className="text-zinc-700">{event.date}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-sm">
                      <Clock className="w-4 h-4 text-zinc-400" />
                      <span className="text-zinc-700">{event.time}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-sm">
                      <MapPin className="w-4 h-4 text-zinc-400" />
                      <div>
                        <p className="text-zinc-700">{event.venue}</p>
                        <p className="text-xs text-zinc-400">
                          {event.location}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 text-sm">
                      <Users className="w-4 h-4 text-zinc-400" />
                      <span className="text-zinc-700">
                        {event.maxAttendees.toLocaleString()} capacity
                      </span>
                    </div>
                  </div>

                  <button className="w-full bg-zinc-900 text-white text-sm font-semibold py-3 rounded-full hover:bg-zinc-800 transition-colors">
                    Get Pass
                  </button>
                  <p className="text-center text-[11px] text-zinc-400 mt-2.5">
                    Requires identity verification
                  </p>
                </div>

                <div className="rounded-lg border border-zinc-100 bg-white p-5">
                  <h4 className="font-semibold text-sm text-zinc-900 mb-3">
                    Eligibility
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-zinc-500">
                      <CheckCircle2 className="w-3.5 h-3.5 text-zinc-300" />
                      Age {event.minAge}+
                    </div>
                    {event.requiresKyc && (
                      <div className="flex items-center gap-2 text-sm text-zinc-500">
                        <CheckCircle2 className="w-3.5 h-3.5 text-zinc-300" />
                        KYC Verified
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-zinc-500">
                      <CheckCircle2 className="w-3.5 h-3.5 text-zinc-300" />
                      Reputation {event.minReputation}+
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Related */}
      {relatedEvents.length > 0 && (
        <section className="py-10 border-t border-zinc-100">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-xl font-semibold text-zinc-900 tracking-tight mb-6">
              More {event.category.replace("-", " ")} events
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {relatedEvents.map((e) => (
                <RaceCard key={e.id} event={e} />
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}

export function generateStaticParams() {
  return events.map((event) => ({ id: event.id }));
}
