"use client";

import { useEffect, useState } from "react";
import { eventApi, type Event } from "@/lib/api";
import { CalendarDays, Plus, MapPin, Users } from "lucide-react";
import Link from "next/link";

export default function AdminEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    eventApi
      .list()
      .then((r) => setEvents(r.events))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter
    ? events.filter((e) => e.status === filter)
    : events;

  const statusColor: Record<string, string> = {
    draft: "bg-zinc-100 text-zinc-600",
    active: "bg-emerald-50 text-emerald-700",
    completed: "bg-blue-50 text-blue-700",
    cancelled: "bg-red-50 text-red-700",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Events
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            Manage platform events
          </p>
        </div>
        <Link
          href="/admin/events/create"
          className="px-4 py-2.5 rounded-lg bg-brand-blue text-white text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Event
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {["", "active", "draft", "completed", "cancelled"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === s
                ? "bg-brand-blue text-white"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            {s || "All"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-brand-blue" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <CalendarDays className="h-10 w-10 text-zinc-300 mx-auto mb-3" />
          <p className="text-zinc-500 text-sm">No events found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((event) => (
            <Link
              key={event.id}
              href={`/admin/events/${event.id}`}
              className="block rounded-xl border border-zinc-200 bg-white p-5 flex items-center justify-between hover:border-zinc-300 transition-colors"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-zinc-900">
                    {event.title}
                  </h3>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      statusColor[event.status] || "bg-zinc-100 text-zinc-600"
                    }`}
                  >
                    {event.status}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-zinc-500">
                  <span className="flex items-center gap-1">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {new Date(event.event_date).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {event.location}
                  </span>
                  {event.max_attendees && (
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      Max {event.max_attendees}
                    </span>
                  )}
                </div>
                <div className="flex gap-3 text-xs text-zinc-400">
                  {event.requires_kyc && <span>KYC Required</span>}
                  {event.min_age && <span>Age {event.min_age}+</span>}
                  {event.min_reputation_score && (
                    <span>Rep {event.min_reputation_score}+</span>
                  )}
                </div>
              </div>
              <p className="text-xs text-zinc-400 font-mono shrink-0 ml-4">
                {event.id.slice(0, 8)}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
