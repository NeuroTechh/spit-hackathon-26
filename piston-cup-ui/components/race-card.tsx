import Link from "next/link";
import Image from "next/image";
import { Calendar, MapPin } from "lucide-react";
import type { RaceEvent } from "@/data/events";
import { RACE_IMAGE } from "@/data/events";

interface RaceCardProps {
  event: RaceEvent;
  compact?: boolean;
}

export function RaceCard({ event, compact }: RaceCardProps) {
  if (compact) {
    return (
      <Link href={`/events/${event.id}`} className="group block">
        <div className="flex gap-4 p-4 rounded-lg border border-zinc-100 hover:border-zinc-200 transition-colors">
          <div className="w-16 h-16 rounded-lg overflow-hidden relative shrink-0">
            <Image
              src={RACE_IMAGE}
              alt={event.title}
              fill
              className="object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm text-zinc-900 truncate group-hover:text-zinc-600 transition-colors">
              {event.title}
            </h4>
            <p className="text-xs text-zinc-400 mt-0.5">{event.date}</p>
            <p className="text-xs text-zinc-400">{event.location}</p>
          </div>
          <StatusBadge status={event.status} />
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/events/${event.id}`} className="group block">
      <div className="rounded-lg border border-zinc-100 overflow-hidden hover:border-zinc-200 transition-colors">
        {/* Image */}
        <div className="relative h-48 overflow-hidden">
          <Image
            src={RACE_IMAGE}
            alt={event.title}
            fill
            className="object-cover group-hover:scale-[1.02] transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-black/20" />

          <div className="absolute top-3 left-3 flex gap-2">
            <StatusBadge status={event.status} />
            {event.isNight && (
              <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-zinc-900/70 text-white backdrop-blur-sm">
                Night
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-semibold text-zinc-900 tracking-tight group-hover:text-zinc-600 transition-colors">
            {event.title}
          </h3>
          <p className="text-sm text-zinc-500 mt-1 line-clamp-1">
            {event.subtitle}
          </p>

          <div className="flex items-center gap-4 mt-3 text-xs text-zinc-400">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {event.date}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {event.location}
            </span>
          </div>

          {event.requiresKyc && (
            <div className="mt-3 flex gap-2">
              <span className="text-[11px] font-medium text-zinc-500 bg-zinc-50 px-2 py-0.5 rounded">
                Verified
              </span>
              <span className="text-[11px] font-medium text-zinc-500 bg-zinc-50 px-2 py-0.5 rounded">
                Pass Available
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

function StatusBadge({ status }: { status: RaceEvent["status"] }) {
  const config: Record<string, { label: string; className: string }> = {
    upcoming: { label: "Upcoming", className: "bg-zinc-100 text-zinc-600" },
    "selling-fast": {
      label: "Selling Fast",
      className: "bg-red-50 text-red-600",
    },
    "sold-out": { label: "Sold Out", className: "bg-zinc-100 text-zinc-400" },
    featured: { label: "Featured", className: "bg-zinc-900 text-white" },
  };
  const s = config[status];
  return (
    <span
      className={`px-2.5 py-1 rounded-full text-[11px] font-medium ${s.className}`}
    >
      {s.label}
    </span>
  );
}
