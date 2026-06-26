"use client";

import { showClientSignOutOverlay } from "@/lib/auth/client-sign-out-overlay";
import { clearUserDependentCaches } from "@/lib/auth/clear-user-dependent-caches";
import { clearEntranceExperienceLock } from "@/hooks/use-entrance-scroll-lock";
import { createClient } from "@/lib/supabase/client";

const HOME_ROUTE = "/diaries";

/**
 * ログアウト — キャッシュ破棄のうえフルリロードでホームへ。
 * 前ユーザーの React 状態が残らないよう location.assign を使う。
 */
export async function performClientSignOut(): Promise<void> {
  showClientSignOutOverlay();

  const supabase = createClient();
  await supabase.auth.signOut();

  clearUserDependentCaches();
  clearEntranceExperienceLock();

  window.location.assign(HOME_ROUTE);
}
