"use client";

import { useEffect, useState } from "react";
import { userApi, type UserProfile } from "@/lib/api";
import { useSession } from "@/lib/auth-client";
import { User, Copy, Check, Loader2 } from "lucide-react";

export default function ProfilePage() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    userApi
      .getProfile()
      .then((p) => {
        setProfile(p);
        setDisplayName(p.displayName);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!displayName.trim()) return;
    setSaving(true);
    try {
      const updated = await userApi.updateProfile(displayName.trim());
      setProfile(updated);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-brand-blue" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-20">
        <p className="text-zinc-500">Failed to load profile.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Profile
        </h1>
        <p className="text-zinc-500 mt-1">
          Manage your identity information.
        </p>
      </div>

      {/* Profile Card */}
      <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-brand-blue/10 to-brand-blue/5" />
        <div className="px-6 pb-6 -mt-8">
          <div className="h-16 w-16 rounded-full bg-white border-4 border-white shadow-sm flex items-center justify-center">
            <User className="h-7 w-7 text-zinc-400" />
          </div>

          <div className="mt-4 space-y-6">
            {/* Display Name */}
            <div>
              <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1.5">
                Display Name
              </label>
              {editing ? (
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg border border-zinc-300 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 outline-none text-sm"
                    autoFocus
                  />
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 rounded-lg bg-brand-blue text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Save"
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setEditing(false);
                      setDisplayName(profile.displayName);
                    }}
                    className="px-4 py-2 rounded-lg border border-zinc-200 text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-zinc-900 font-medium">
                    {profile.displayName}
                  </p>
                  <button
                    onClick={() => setEditing(true)}
                    className="text-xs text-brand-blue hover:text-blue-700 font-medium transition-colors"
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>

            {/* Email */}
            <InfoRow label="Email" value={session?.user?.email || "—"} />

            {/* Role */}
            <div>
              <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1.5">
                Role
              </label>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-100 text-zinc-700 capitalize">
                {profile.role}
              </span>
            </div>

            {/* DID */}
            <div>
              <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1.5">
                Decentralized Identifier (DID)
              </label>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs font-mono text-zinc-600 bg-zinc-50 px-3 py-2 rounded-lg truncate">
                  {profile.did}
                </code>
                <button
                  onClick={() => copyToClipboard(profile.did, "did")}
                  className="shrink-0 p-2 rounded-lg hover:bg-zinc-100 transition-colors"
                >
                  {copied === "did" ? (
                    <Check className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Copy className="h-4 w-4 text-zinc-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Wallet */}
            <div>
              <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1.5">
                Wallet Address
              </label>
              {profile.walletAddress ? (
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs font-mono text-zinc-600 bg-zinc-50 px-3 py-2 rounded-lg truncate">
                    {profile.walletAddress}
                  </code>
                  <button
                    onClick={() =>
                      copyToClipboard(profile.walletAddress!, "wallet")
                    }
                    className="shrink-0 p-2 rounded-lg hover:bg-zinc-100 transition-colors"
                  >
                    {copied === "wallet" ? (
                      <Check className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <Copy className="h-4 w-4 text-zinc-400" />
                    )}
                  </button>
                </div>
              ) : (
                <p className="text-sm text-zinc-400 italic">
                  No wallet connected
                </p>
              )}
            </div>

            {/* Status */}
            <InfoRow
              label="Account Status"
              value={profile.isActive ? "Active" : "Inactive"}
            />

            {/* Created */}
            <InfoRow
              label="Member Since"
              value={new Date(profile.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <p className="text-sm text-zinc-900">{value}</p>
    </div>
  );
}
