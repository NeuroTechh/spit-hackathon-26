"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { useSession } from "@/lib/auth-client";
import { eventApi, type UserPass } from "@/lib/api";
import {
  Calendar,
  MapPin,
  ShieldCheck,
  Ticket,
  Loader2,
  CheckCircle2,
  Clock,
} from "lucide-react";

export default function MyPassesPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [passes, setPasses] = useState<UserPass[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isPending) return;
    if (!session) {
      router.push("/login");
      return;
    }

    eventApi
      .getMyPasses()
      .then((r) => setPasses(r.passes))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [session, isPending, router]);

  if (isPending || (!session && !loading)) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <Navbar />

      <section className="border-b border-zinc-100 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
            My Passes
          </h1>
          <p className="text-zinc-500 mt-1 text-sm">
            Your event passes and check-in status
          </p>
        </div>
      </section>

      <section className="py-10">
        <div className="max-w-6xl mx-auto px-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-zinc-300" />
            </div>
          ) : passes.length === 0 ? (
            <div className="text-center py-20">
              <Ticket className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
              <p className="text-zinc-500 text-sm mb-4">
                You don&apos;t have any passes yet.
              </p>
              <Link
                href="/events"
                className="text-sm font-medium text-zinc-900 bg-zinc-100 hover:bg-zinc-200 px-5 py-2.5 rounded-full transition-colors"
              >
                Browse Events
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {passes.map((pass) => (
                <PassCard key={pass.id} pass={pass} />
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}

function PassCard({ pass }: { pass: UserPass }) {
  const eventDate = new Date(pass.event_date);
  const isPast = eventDate < new Date();

  return (
    <Link
      href={`/events/${pass.event_id}`}
      className="block rounded-xl border border-zinc-200 bg-white p-5 hover:border-zinc-300 transition-colors"
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-zinc-900 leading-tight pr-2">
          {pass.title}
        </h3>
        {pass.is_checked_in ? (
          <span className="shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700">
            <CheckCircle2 className="w-3 h-3" />
            Checked in
          </span>
        ) : isPast ? (
          <span className="shrink-0 px-2 py-0.5 rounded-full text-[11px] font-medium bg-zinc-100 text-zinc-500">
            Ended
          </span>
        ) : (
          <span className="shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700">
            <Clock className="w-3 h-3" />
            Upcoming
          </span>
        )}
      </div>

      <div className="space-y-2 text-sm text-zinc-500">
        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5" />
          <span>
            {eventDate.toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5" />
          <span>{pass.location}</span>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-zinc-400">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Pass #{pass.id.slice(0, 8)}</span>
        </div>
        {pass.token_id != null && (
          <span className="text-xs text-zinc-400 font-mono">
            NFT #{pass.token_id}
          </span>
        )}
      </div>
    </Link>
  );
}
