"use client";

import Image from "next/image";
import Link from "next/link";
import { RACE_IMAGE } from "@/data/events";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-zinc-950">
      {/* Background image */}
      <Image
        src={RACE_IMAGE}
        alt="Racing"
        fill
        className="object-cover opacity-60"
        priority
      />

      {/* Content */}
      <div className="relative max-w-6xl mx-auto px-6 py-28 sm:py-40">
        <p className="text-sm text-zinc-400 mb-4">Piston Cup 2026 Season</p>

        <h1 className="text-4xl sm:text-6xl font-semibold tracking-tight text-white leading-[1.1] mb-5 max-w-2xl">
          The premier motorsport experience.
        </h1>

        <p className="text-zinc-400 text-base sm:text-lg max-w-md leading-relaxed mb-10">
          Discover races, earn your verified pass, and experience the thrill of
          the track.
        </p>

        <div className="flex items-center gap-4">
          <Link
            href="/events"
            className="bg-white text-zinc-900 px-6 py-3 rounded-full text-sm font-semibold hover:bg-zinc-100 transition-colors"
          >
            Browse Events
          </Link>
          <Link
            href="/login"
            className="text-white text-sm font-medium hover:text-zinc-300 transition-colors"
          >
            Get your pass &rarr;
          </Link>
        </div>
      </div>
    </section>
  );
}
