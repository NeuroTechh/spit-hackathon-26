"use client";

import { useEffect, useState } from "react";
import { userApi, type UserProfile } from "@/lib/api";
import { useSession, signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Shield,
  Loader2,
  LogOut,
} from "lucide-react";

export default function SettingsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

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
    setSaved(false);
    try {
      const updated = await userApi.updateProfile(displayName.trim());
      setProfile(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-brand-blue" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Settings
        </h1>
        <p className="text-zinc-500 mt-1">Manage your account preferences.</p>
      </div>

      {/* Profile Settings */}
      <section className="rounded-xl border border-zinc-200 bg-white p-6 space-y-5">
        <h2 className="font-semibold text-zinc-900 flex items-center gap-2">
          <User className="h-4 w-4 text-zinc-400" />
          Profile
        </h2>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1.5">
            Display Name
          </label>
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg border border-zinc-300 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 outline-none text-sm"
            />
            <button
              onClick={handleSave}
              disabled={saving || displayName === profile?.displayName}
              className="px-4 py-2 rounded-lg bg-brand-blue text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : saved ? (
                "Saved"
              ) : (
                "Save"
              )}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1.5">
            Email
          </label>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-50 text-sm text-zinc-600">
            <Mail className="h-4 w-4 text-zinc-400" />
            {session?.user?.email || "—"}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1.5">
            Role
          </label>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-50 text-sm text-zinc-600">
            <Shield className="h-4 w-4 text-zinc-400" />
            <span className="capitalize">{profile?.role}</span>
          </div>
        </div>
      </section>

      {/* Account section */}
      <section className="rounded-xl border border-zinc-200 bg-white p-6 space-y-5">
        <h2 className="font-semibold text-zinc-900">Account</h2>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1.5">
            DID
          </label>
          <code className="block text-xs font-mono text-zinc-500 bg-zinc-50 px-3 py-2 rounded-lg truncate">
            {profile?.did}
          </code>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1.5">
            Wallet
          </label>
          {profile?.walletAddress ? (
            <code className="block text-xs font-mono text-zinc-500 bg-zinc-50 px-3 py-2 rounded-lg truncate">
              {profile.walletAddress}
            </code>
          ) : (
            <p className="text-sm text-zinc-400 italic px-3 py-2 bg-zinc-50 rounded-lg">
              No wallet connected — wallet connection API pending
            </p>
          )}
        </div>
      </section>

      {/* Danger Zone */}
      <section className="rounded-xl border border-red-100 bg-white p-6">
        <h2 className="font-semibold text-red-600 mb-4">Sign Out</h2>
        <p className="text-sm text-zinc-500 mb-4">
          You will be signed out of your current session.
        </p>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-red-200 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </section>
    </div>
  );
}
