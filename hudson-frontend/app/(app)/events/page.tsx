"use client";

import { useEffect, useState } from "react";
import { eventApi, type Event } from "@/lib/api";
import { userApi, type UserProfile } from "@/lib/api";
import {
  CalendarDays,
  MapPin,
  Users,
  ShieldCheck,
  Star,
  Plus,
  Filter,
} from "lucide-react";
import Link from "next/link";

const statusTabs = [
  { value: "", label: "All" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    Promise.allSettled([
      eventApi.list(statusFilter || undefined),
      userApi.getProfile(),
    ]).then(([eventsResult, profileResult]) => {
      if (eventsResult.status === "fulfilled")
        setEvents(eventsResult.value.events);
      if (profileResult.status === "fulfilled")
        setProfile(profileResult.value);
      setLoading(false);
    });
  }, [statusFilter]);

  const canCreateEvent =
    profile?.role === "organizer" || profile?.role === "verifier";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-brand-blue" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Events
          </h1>
          <p className="text-zinc-500 mt-1">
            Browse events and mint Soulbound NFT passes.
          </p>
        </div>
        {canCreateEvent && (
          <Link
            href="/events/create"
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-brand-blue text-white text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create Event
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-zinc-400" />
        {statusTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              statusFilter === tab.value
                ? "bg-brand-blue text-white"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Events Grid */}
      {events.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center">
          <CalendarDays className="h-10 w-10 text-zinc-300 mx-auto mb-3" />
          <p className="text-sm text-zinc-500">
            No events found. Check back later for upcoming events.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {events.map((event) => (
            <Link
              key={event.id}
              href={`/events/${event.id}`}
              className="rounded-xl border border-zinc-200 bg-white p-6 hover:border-zinc-300 transition-colors group"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-zinc-900 group-hover:text-brand-blue transition-colors">
                  {event.title}
                </h3>
                <span
                  className={`shrink-0 px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
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
                <p className="text-sm text-zinc-500 mb-4 line-clamp-2">
                  {event.description}
                </p>
              )}

              <div className="space-y-2 text-sm text-zinc-500">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {new Date(event.event_date).toLocaleDateString("en-US", {
                    weekday: "short",
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
                {event.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5" />
                    {event.location}
                  </div>
                )}
              </div>

              {/* Requirements badges */}
              <div className="flex flex-wrap gap-2 mt-4">
                {event.min_age && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-zinc-50 text-xs text-zinc-600">
                    <Users className="h-3 w-3" />
                    {event.min_age}+
                  </span>
                )}
                {event.requires_kyc && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-zinc-50 text-xs text-zinc-600">
                    <ShieldCheck className="h-3 w-3" />
                    KYC Required
                  </span>
                )}
                {event.min_reputation_score != null && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-zinc-50 text-xs text-zinc-600">
                    <Star className="h-3 w-3" />
                    Rep {event.min_reputation_score}+
                  </span>
                )}
                {event.max_attendees != null && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-zinc-50 text-xs text-zinc-600">
                    <Users className="h-3 w-3" />
                    Max {event.max_attendees}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
