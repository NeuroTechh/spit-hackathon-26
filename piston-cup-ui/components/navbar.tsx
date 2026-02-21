"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Menu, X } from "lucide-react";

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-zinc-100">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between h-14">
          <Link
            href="/"
            className="text-zinc-900 font-semibold tracking-tight"
          >
            Piston Cup
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link
              href="/events"
              className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
            >
              Events
            </Link>
            <button className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5" />
              Search
            </button>
            <Link
              href="/login"
              className="text-sm font-medium text-zinc-900 bg-zinc-100 hover:bg-zinc-200 px-4 py-2 rounded-full transition-colors"
            >
              Sign in
            </Link>
          </div>

          <button
            className="md:hidden p-1.5"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? (
              <X className="w-5 h-5 text-zinc-700" />
            ) : (
              <Menu className="w-5 h-5 text-zinc-700" />
            )}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-zinc-100 bg-white px-6 py-4 space-y-3">
          <Link href="/events" className="block text-sm text-zinc-600 py-1.5">
            Events
          </Link>
          <Link
            href="/login"
            className="block text-sm font-medium text-zinc-900 bg-zinc-100 text-center py-2.5 rounded-full"
          >
            Sign in
          </Link>
        </div>
      )}
    </nav>
  );
}
