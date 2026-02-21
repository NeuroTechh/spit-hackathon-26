"use client";

import { useSession } from "@/lib/auth-client";
import { userApi } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (isPending) return;
    if (!session) {
      router.replace("/login");
      return;
    }

    userApi
      .getProfile()
      .then((profile) => {
        if (profile.role !== "admin") {
          router.replace("/dashboard");
        } else {
          setAuthorized(true);
        }
      })
      .catch(() => router.replace("/login"))
      .finally(() => setChecking(false));
  }, [session, isPending, router]);

  if (isPending || checking) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#FAFAFA]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-brand-blue" />
          <p className="text-sm text-zinc-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!authorized) return null;

  return <>{children}</>;
}
