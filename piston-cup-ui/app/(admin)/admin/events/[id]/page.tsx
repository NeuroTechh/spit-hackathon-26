"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  eventApi,
  type Event,
  type EventPassAttendee,
} from "@/lib/api";
import {
  ArrowLeft,
  CalendarDays,
  MapPin,
  Users,
  CheckCircle2,
  Clock,
  Loader2,
} from "lucide-react";

export default function AdminEventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [passes, setPasses] = useState<EventPassAttendee[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    Promise.all([eventApi.get(id), eventApi.getEventPasses(id)])
      .then(([evt, { passes }]) => {
        setEvent(evt);
        setPasses(passes);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const handleCheckIn = async (passId: string) => {
    if (!id) return;
    setCheckingIn(passId);
    try {
      await eventApi.checkIn(id, passId);
      setPasses((prev) =>
        prev.map((p) =>
          p.id === passId
            ? { ...p, is_checked_in: true, checked_in_at: new Date().toISOString() }
            : p
        )
      );
    } catch (err: any) {
      alert(err.message || "Check-in failed");
    } finally {
      setCheckingIn(null);
    }
  };

  const checkedIn = passes.filter((p) => p.is_checked_in).length;
  const notArrived = passes.length - checkedIn;

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
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/admin/events"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Events
      </Link>

      {/* Event header */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
              {event.title}
            </h1>
            <div className="flex items-center gap-4 text-sm text-zinc-500">
              <span className="flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5" />
                {new Date(event.event_date).toLocaleDateString("en-US", {
                  weekday: "short",
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </span>
              {event.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {event.location}
                </span>
              )}
            </div>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              event.status === "active"
                ? "bg-emerald-50 text-emerald-700"
                : event.status === "completed"
                ? "bg-blue-50 text-blue-700"
                : "bg-zinc-100 text-zinc-600"
            }`}
          >
            {event.status}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-zinc-100 flex items-center justify-center">
              <Users className="h-5 w-5 text-zinc-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-zinc-900">{passes.length}</p>
              <p className="text-xs text-zinc-500">Total Passes</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-zinc-900">{checkedIn}</p>
              <p className="text-xs text-zinc-500">Checked In</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-50 flex items-center justify-center">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-zinc-900">{notArrived}</p>
              <p className="text-xs text-zinc-500">Not Arrived</p>
            </div>
          </div>
        </div>
      </div>

      {/* Attendees table */}
      <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-100">
          <h2 className="font-semibold text-zinc-900">Attendees</h2>
        </div>

        {passes.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-8 w-8 text-zinc-300 mx-auto mb-2" />
            <p className="text-sm text-zinc-500">No passes minted yet.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-100 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                <th className="px-6 py-3">Attendee</th>
                <th className="px-6 py-3">Pass ID</th>
                <th className="px-6 py-3">Minted</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {passes.map((pass) => (
                <tr key={pass.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-zinc-900 text-white flex items-center justify-center text-xs font-medium">
                        {pass.user_name?.charAt(0).toUpperCase() || "?"}
                      </div>
                      <span className="text-sm font-medium text-zinc-900">
                        {pass.user_name || "Unknown"}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-mono text-zinc-500">
                      {pass.id.slice(0, 8)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-500">
                    {new Date(pass.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    {pass.is_checked_in ? (
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                          <CheckCircle2 className="h-3 w-3" />
                          Checked in
                        </span>
                        {pass.checked_in_at && (
                          <span className="text-xs text-zinc-400">
                            {new Date(pass.checked_in_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
                        <Clock className="h-3 w-3" />
                        Not arrived
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {pass.is_checked_in ? (
                      <span className="text-xs text-zinc-400">Done</span>
                    ) : (
                      <button
                        onClick={() => handleCheckIn(pass.id)}
                        disabled={checkingIn === pass.id}
                        className="px-3 py-1.5 rounded-lg bg-zinc-900 text-white text-xs font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
                      >
                        {checkingIn === pass.id ? (
                          <>
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Checking in...
                          </>
                        ) : (
                          "Check In"
                        )}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
