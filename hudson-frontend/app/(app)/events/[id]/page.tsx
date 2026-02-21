"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { eventApi, type Event, type Eligibility } from "@/lib/api";
import {
  CalendarDays,
  MapPin,
  Users,
  ShieldCheck,
  Star,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  XCircle,
  Ticket,
} from "lucide-react";
import Link from "next/link";

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [eligibility, setEligibility] = useState<Eligibility | null>(null);
  const [loading, setLoading] = useState(true);
  const [minting, setMinting] = useState(false);
  const [mintSuccess, setMintSuccess] = useState(false);

  useEffect(() => {
    Promise.allSettled([
      eventApi.get(eventId),
      eventApi.checkEligibility(eventId),
    ]).then(([eventResult, eligResult]) => {
      if (eventResult.status === "fulfilled") setEvent(eventResult.value);
      if (eligResult.status === "fulfilled") setEligibility(eligResult.value);
      setLoading(false);
    });
  }, [eventId]);

  const handleMint = async () => {
    setMinting(true);
    try {
      await eventApi.mintPass(eventId);
      setMintSuccess(true);
    } catch (err) {
      console.error("Failed to mint pass:", err);
    } finally {
      setMinting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-brand-blue" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-20">
        <p className="text-zinc-500">Event not found.</p>
        <button
          onClick={() => router.back()}
          className="mt-4 text-sm text-brand-blue hover:text-blue-700 font-medium"
        >
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Link
        href="/events"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Events
      </Link>

      {/* Event Header */}
      <div className="rounded-xl border border-zinc-200 bg-white p-8">
        <div className="flex items-start justify-between mb-4">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            {event.title}
          </h1>
          <span
            className={`shrink-0 px-3 py-1 rounded-full text-sm font-medium capitalize ${
              event.status === "active"
                ? "bg-emerald-50 text-emerald-700"
                : event.status === "completed"
                ? "bg-zinc-100 text-zinc-600"
                : event.status === "cancelled"
                ? "bg-red-50 text-red-600"
                : "bg-amber-50 text-amber-700"
            }`}
          >
            {event.status}
          </span>
        </div>

        {event.description && (
          <p className="text-zinc-600 mb-6">{event.description}</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-3 text-zinc-600">
            <CalendarDays className="h-4 w-4 text-zinc-400" />
            {new Date(event.event_date).toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
          {event.location && (
            <div className="flex items-center gap-3 text-zinc-600">
              <MapPin className="h-4 w-4 text-zinc-400" />
              {event.location}
            </div>
          )}
          {event.max_attendees != null && (
            <div className="flex items-center gap-3 text-zinc-600">
              <Users className="h-4 w-4 text-zinc-400" />
              Max {event.max_attendees} attendees
            </div>
          )}
        </div>

        {/* Requirements */}
        {(event.min_age || event.requires_kyc || event.min_reputation_score != null) && (
          <div className="mt-6 pt-6 border-t border-zinc-100">
            <h3 className="text-sm font-semibold text-zinc-900 mb-3">
              Requirements
            </h3>
            <div className="flex flex-wrap gap-3">
              {event.min_age && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-50 text-sm text-zinc-600">
                  <Users className="h-4 w-4" />
                  Minimum age: {event.min_age}
                </div>
              )}
              {event.requires_kyc && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-50 text-sm text-zinc-600">
                  <ShieldCheck className="h-4 w-4" />
                  KYC verification required
                </div>
              )}
              {event.min_reputation_score != null && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-50 text-sm text-zinc-600">
                  <Star className="h-4 w-4" />
                  Min reputation: {event.min_reputation_score}
                </div>
              )}
            </div>
          </div>
        )}

        {/* On-chain info */}
        {event.on_chain_tx_hash && (
          <div className="mt-6 pt-6 border-t border-zinc-100">
            <p className="text-xs text-zinc-400 font-mono">
              On-chain ID: {event.on_chain_event_id} · Tx:{" "}
              {event.on_chain_tx_hash}
            </p>
          </div>
        )}
      </div>

      {/* Eligibility & Mint */}
      {event.status === "active" && (
        <div className="rounded-xl border border-zinc-200 bg-white p-6">
          <h2 className="font-semibold text-zinc-900 mb-4">
            Mint Event Pass
          </h2>

          {mintSuccess ? (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-emerald-50 border border-emerald-100">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <div>
                <p className="text-sm font-medium text-emerald-900">
                  Pass minted successfully!
                </p>
                <p className="text-xs text-emerald-700 mt-0.5">
                  Your Soulbound NFT pass has been minted to your wallet.
                </p>
              </div>
            </div>
          ) : eligibility ? (
            <>
              {eligibility.eligible ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-emerald-600">
                    <CheckCircle2 className="h-4 w-4" />
                    You are eligible for this event
                  </div>
                  <button
                    onClick={handleMint}
                    disabled={minting}
                    className="flex items-center gap-2 px-6 py-3 rounded-full bg-brand-blue text-white font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {minting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Ticket className="h-4 w-4" />
                    )}
                    Mint Soulbound Pass
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-red-600">
                    <XCircle className="h-4 w-4" />
                    You are not eligible for this event
                  </div>
                  <ul className="space-y-2">
                    {eligibility.errors.map((err, i) => (
                      <li
                        key={i}
                        className="flex items-center gap-2 text-sm text-zinc-600 bg-zinc-50 px-3 py-2 rounded-lg"
                      >
                        <XCircle className="h-3.5 w-3.5 text-red-400 shrink-0" />
                        {err}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/verification"
                    className="inline-flex text-sm font-medium text-brand-blue hover:text-blue-700 transition-colors"
                  >
                    Complete verification to become eligible
                  </Link>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-zinc-500">
              Unable to check eligibility. Please try again later.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
