import { clearAllMemoShelfPageCaches } from "@/lib/memories/memo-shelf-page-cache";
import { clearMemoShelfLoadProfiles } from "@/lib/memories/memo-shelf-load-profile";
import { clearGuestDiaryDrafts } from "@/lib/night/guest-diary-drafts";

/** ログアウト時 — 前ユーザーのクライアントキャッシュを破棄 */
export function clearUserDependentCaches(): void {
  clearAllMemoShelfPageCaches();
  clearMemoShelfLoadProfiles();
  clearGuestDiaryDrafts();
}
