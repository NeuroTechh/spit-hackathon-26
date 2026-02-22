"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { eventApi, ApiError } from "@/lib/api";
import type { RaceEvent } from "@/data/events";

type EligibilityState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "eligible" }
  | { status: "ineligible"; errors: string[] }
  | { status: "already-owned" }
  | { status: "not-registered" }
  | { status: "error"; message: string };

type MintState =
  | { status: "idle" }
  | { status: "minting" }
  | { status: "success"; txHash: string; tokenId: number | null }
  | { status: "error"; message: string };

export function EventPassSidebar({ event }: { event: RaceEvent }) {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [backendEventId, setBackendEventId] = useState<string | null>(null);
  const [eligibility, setEligibility] = useState<EligibilityState>({ status: "idle" });
  const [mint, setMint] = useState<MintState>({ status: "idle" });

  // Resolve backend event UUID by title, then check eligibility
  useEffect(() => {
    if (!session || isPending) return;

    let cancelled = false;
    setEligibility({ status: "loading" });

    (async () => {
      // Step 1: find the matching backend event by title
      const backendEvent = await eventApi.findByTitle(event.title);
      if (cancelled) return;

      if (!backendEvent) {
        setEligibility({ status: "not-registered" });
        return;
      }

      setBackendEventId(backendEvent.id);

      // Step 2: check eligibility using the real backend UUID
      try {
        const result = await eventApi.checkEligibility(backendEvent.id);
        if (cancelled) return;
        if (result.eligible) {
          setEligibility({ status: "eligible" });
        } else if (result.errors.some((e) => e.toLowerCase().includes("already have a pass"))) {
          setEligibility({ status: "already-owned" });
        } else {
          setEligibility({ status: "ineligible", errors: result.errors });
        }
      } catch (err) {
        if (cancelled) return;
        setEligibility({
          status: "error",
          message: err instanceof ApiError ? err.message : "Failed to check eligibility",
        });
      }
    })();

    return () => { cancelled = true; };
  }, [session, isPending, event.title]);

  const handleGetPass = async () => {
    if (!session) {
      router.push("/login");
      return;
    }

    if (!backendEventId) return;

    setMint({ status: "minting" });
    try {
      const pass = await eventApi.mintPass(backendEventId);
      setMint({
        status: "success",
        txHash: pass.mint_tx_hash,
        tokenId: pass.token_id,
      });
    } catch (err) {
      setMint({
        status: "error",
        message: err instanceof ApiError ? err.message : "Failed to mint pass",
      });
    }
  };

  const isEligible = eligibility.status === "eligible";
  const isMinting = mint.status === "minting";
  const isMinted = mint.status === "success";
  const isNotRegistered = eligibility.status === "not-registered";
  const isAlreadyOwned = eligibility.status === "already-owned";

  return (
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
              <p className="text-xs text-zinc-400">{event.location}</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 text-sm">
            <Users className="w-4 h-4 text-zinc-400" />
            <span className="text-zinc-700">
              {event.maxAttendees.toLocaleString()} capacity
            </span>
          </div>
        </div>

        {/* Already owns a pass */}
        {isAlreadyOwned && (
          <div className="mb-4 p-4 rounded-lg bg-emerald-50 border border-emerald-200">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span className="text-sm font-semibold text-emerald-800">
                You already have a pass
              </span>
            </div>
            <p className="text-xs text-emerald-700 mt-1">
              Your pass for this event has been minted. See you there!
            </p>
          </div>
        )}

        {/* Not registered in backend */}
        {isNotRegistered && session && (
          <div className="mb-4 p-3 rounded-lg bg-zinc-50 border border-zinc-200">
            <p className="text-xs text-zinc-500">
              This event hasn&apos;t been registered on-chain yet. Passes will be available once an organizer sets it up.
            </p>
          </div>
        )}

        {/* Minted success state */}
        {isMinted && (
          <div className="mb-4 p-4 rounded-lg bg-emerald-50 border border-emerald-200">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span className="text-sm font-semibold text-emerald-800">
                Pass Minted!
              </span>
            </div>
            {mint.tokenId !== null && (
              <p className="text-xs text-emerald-700 mb-1">
                Token ID: #{mint.tokenId}
              </p>
            )}
            {mint.txHash && (
              <p className="text-xs text-emerald-600 truncate">
                Tx: {mint.txHash.slice(0, 10)}...{mint.txHash.slice(-8)}
              </p>
            )}
          </div>
        )}

        {/* Mint error */}
        {mint.status === "error" && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200">
            <div className="flex items-start gap-2">
              <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-xs text-red-700">{mint.message}</p>
            </div>
          </div>
        )}

        {/* Button */}
        {!isMinted && !isAlreadyOwned && (
          <button
            onClick={handleGetPass}
            disabled={
              isPending ||
              isMinting ||
              isNotRegistered ||
              (!!session && eligibility.status === "loading") ||
              (!!session && eligibility.status === "ineligible")
            }
            className="w-full bg-zinc-900 text-white text-sm font-semibold py-3 rounded-full hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isMinting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Minting...
              </>
            ) : !session ? (
              "Sign in to Get Pass"
            ) : eligibility.status === "loading" ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Checking eligibility...
              </>
            ) : isNotRegistered ? (
              "Not Available Yet"
            ) : isEligible ? (
              "Get Pass"
            ) : (
              "Not Eligible"
            )}
          </button>
        )}

        {!session && !isPending && (
          <p className="text-center text-[11px] text-zinc-400 mt-2.5">
            Requires identity verification
          </p>
        )}
      </div>

      {/* Eligibility card */}
      <div className="rounded-lg border border-zinc-100 bg-white p-5">
        <h4 className="font-semibold text-sm text-zinc-900 mb-3">
          Eligibility
        </h4>
        <div className="space-y-2">
          <EligibilityRow
            label={`Age ${event.minAge}+`}
            checked={isEligible}
            failed={
              eligibility.status === "ineligible" &&
              eligibility.errors.some((e) => e.toLowerCase().includes("age"))
            }
          />
          {event.requiresKyc && (
            <EligibilityRow
              label="KYC Verified"
              checked={isEligible}
              failed={
                eligibility.status === "ineligible" &&
                eligibility.errors.some((e) => e.toLowerCase().includes("kyc"))
              }
            />
          )}
          <EligibilityRow
            label={`Reputation ${event.minReputation}+`}
            checked={isEligible}
            failed={
              eligibility.status === "ineligible" &&
              eligibility.errors.some((e) =>
                e.toLowerCase().includes("reputation")
              )
            }
          />
        </div>

        {eligibility.status === "ineligible" && (
          <div className="mt-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
            <p className="text-xs text-amber-800 font-medium mb-1">
              Missing requirements:
            </p>
            <ul className="space-y-0.5">
              {eligibility.errors.map((err, i) => (
                <li key={i} className="text-xs text-amber-700">
                  • {err}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function EligibilityRow({
  label,
  checked,
  failed,
}: {
  label: string;
  checked: boolean;
  failed: boolean;
}) {
  return (
    <div className="flex items-center gap-2 text-sm text-zinc-500">
      <CheckCircle2
        className={`w-3.5 h-3.5 ${
          failed
            ? "text-red-400"
            : checked
              ? "text-emerald-500"
              : "text-zinc-300"
        }`}
      />
      <span className={failed ? "text-red-600" : ""}>{label}</span>
    </div>
  );
}
