"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { eventApi } from "@/lib/api";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

export default function AdminCreateEventPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    eventDate: "",
    location: "",
    minAge: "",
    requiresKyc: false,
    minReputationScore: "",
    maxAttendees: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await eventApi.create({
        title: form.title,
        description: form.description,
        eventDate: new Date(form.eventDate).toISOString(),
        location: form.location,
        ...(form.minAge ? { minAge: Number(form.minAge) } : {}),
        requiresKyc: form.requiresKyc,
        ...(form.minReputationScore
          ? { minReputationScore: Number(form.minReputationScore) }
          : {}),
        ...(form.maxAttendees
          ? { maxAttendees: Number(form.maxAttendees) }
          : {}),
      });
      router.push("/admin/events");
    } catch {
      setError("Failed to create event. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <Link
        href="/admin/events"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Events
      </Link>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Create Event
        </h1>
        <p className="text-zinc-500 mt-1 text-sm">
          Set up a new event with on-chain Soulbound NFT passes.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-5">
          <InputField
            label="Event Title"
            value={form.title}
            onChange={(v) => setForm({ ...form, title: v })}
            placeholder="Web3 Conference 2024"
            required
          />
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              rows={3}
              placeholder="Describe your event..."
              className="w-full px-3 py-2 rounded-lg border border-zinc-300 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 outline-none text-sm resize-none"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField
              label="Event Date"
              type="datetime-local"
              value={form.eventDate}
              onChange={(v) => setForm({ ...form, eventDate: v })}
              required
            />
            <InputField
              label="Location"
              value={form.location}
              onChange={(v) => setForm({ ...form, location: v })}
              placeholder="San Francisco, CA"
              required
            />
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-5">
          <h3 className="font-semibold text-zinc-900">Requirements</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField
              label="Minimum Age"
              type="number"
              value={form.minAge}
              onChange={(v) => setForm({ ...form, minAge: v })}
              placeholder="18"
            />
            <InputField
              label="Min Reputation Score"
              type="number"
              value={form.minReputationScore}
              onChange={(v) =>
                setForm({ ...form, minReputationScore: v })
              }
              placeholder="50"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField
              label="Max Attendees"
              type="number"
              value={form.maxAttendees}
              onChange={(v) => setForm({ ...form, maxAttendees: v })}
              placeholder="500"
            />
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">
                KYC Required
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.requiresKyc}
                  onChange={(e) =>
                    setForm({ ...form, requiresKyc: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500"
                />
                <span className="text-sm text-zinc-600">
                  Require KYC verification
                </span>
              </label>
            </div>
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 rounded-full bg-brand-blue text-white font-semibold text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Create Event
        </button>
      </form>
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-zinc-700 mb-1.5">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full px-3 py-2 rounded-lg border border-zinc-300 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 outline-none text-sm"
      />
    </div>
  );
}
