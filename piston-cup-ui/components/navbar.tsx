"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Menu, X, LogOut, User } from "lucide-react";
import { useSession, signOut } from "@/lib/auth-client";

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: session, isPending } = useSession();

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/";
  };

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

            {isPending ? (
              <div className="h-8 w-8 rounded-full bg-zinc-100 animate-pulse" />
            ) : session ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-sm text-zinc-700">
                  <div className="h-7 w-7 rounded-full bg-zinc-900 text-white flex items-center justify-center text-xs font-medium">
                    {session.user.name?.charAt(0).toUpperCase() || <User className="w-3.5 h-3.5" />}
                  </div>
                  <span className="font-medium max-w-[120px] truncate">
                    {session.user.name || session.user.email}
                  </span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="text-zinc-400 hover:text-zinc-700 transition-colors p-1.5"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="text-sm font-medium text-zinc-900 bg-zinc-100 hover:bg-zinc-200 px-4 py-2 rounded-full transition-colors"
              >
                Sign in
              </Link>
            )}
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
          {session ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-zinc-700 py-1.5">
                <div className="h-7 w-7 rounded-full bg-zinc-900 text-white flex items-center justify-center text-xs font-medium">
                  {session.user.name?.charAt(0).toUpperCase() || "?"}
                </div>
                <span className="font-medium">
                  {session.user.name || session.user.email}
                </span>
              </div>
              <button
                onClick={handleSignOut}
                className="block w-full text-sm font-medium text-red-600 bg-red-50 text-center py-2.5 rounded-full"
              >
                Sign out
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="block text-sm font-medium text-zinc-900 bg-zinc-100 text-center py-2.5 rounded-full"
            >
              Sign in
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
