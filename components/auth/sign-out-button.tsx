"use client";

import { showClientSignOutOverlay } from "@/lib/auth/client-sign-out-overlay";
import { performClientSignOut } from "@/lib/auth/perform-client-sign-out";
import { useState } from "react";

export function SignOutButton() {
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    if (loading) return;
    setLoading(true);
    showClientSignOutOverlay();

    try {
      await performClientSignOut();
    } catch {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={() => void handleSignOut()}
      disabled={loading}
      className="rounded-full border border-stone-600 px-4 py-2 text-sm text-stone-300 transition-colors hover:border-stone-500 hover:text-stone-200 disabled:opacity-50"
    >
      {loading ? "…" : "ログアウト"}
    </button>
  );
}
