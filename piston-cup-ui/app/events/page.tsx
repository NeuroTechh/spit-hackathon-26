"use client";

import { useState, useMemo } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { RaceCard } from "@/components/race-card";
import { events, categories } from "@/data/events";
import { Grid3X3, List } from "lucide-react";

export default function EventsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const filteredEvents = useMemo(() => {
    if (selectedCategory === "all") return events;
    return events.filter((e) => e.category === selectedCategory);
  }, [selectedCategory]);

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <Navbar />

      {/* Header */}
      <section className="border-b border-zinc-100 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
            All Events
          </h1>
          <p className="text-zinc-500 mt-1 text-sm">
            Browse {events.length} upcoming Piston Cup races and events
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="sticky top-14 z-40 bg-white/80 backdrop-blur-xl border-b border-zinc-100">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between py-3 gap-4">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === "all"
                    ? "bg-zinc-900 text-white"
                    : "bg-zinc-100 text-zinc-500 hover:text-zinc-900"
                }`}
              >
                All Events
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === cat.id
                      ? "bg-zinc-900 text-white"
                      : "bg-zinc-100 text-zinc-500 hover:text-zinc-900"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            <div className="hidden sm:flex items-center gap-1 shrink-0">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded transition-colors ${
                  viewMode === "grid"
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-400 hover:text-zinc-700"
                }`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded transition-colors ${
                  viewMode === "list"
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-400 hover:text-zinc-700"
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Events */}
      <section className="py-10">
        <div className="max-w-6xl mx-auto px-6">
          {filteredEvents.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-zinc-400">No events in this category yet.</p>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEvents.map((event) => (
                <RaceCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredEvents.map((event) => (
                <RaceCard key={event.id} event={event} compact />
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
