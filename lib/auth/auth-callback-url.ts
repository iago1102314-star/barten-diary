/** OAuth 完了後に戻る URL（クエリなし — Supabase の Redirect URLs と完全一致させる） */
export function buildAuthCallbackUrl(origin: string): string {
  return `${origin.replace(/\/$/, "")}/auth/callback`;
}

/** Supabase が返した OAuth URL の redirect_to を検証する */
export function readOAuthRedirectTo(oauthUrl: string): string | null {
  try {
    const redirectTo = new URL(oauthUrl).searchParams.get("redirect_to");
    return redirectTo ? decodeURIComponent(redirectTo) : null;
  } catch {
    return null;
  }
}

export function authCallbackUrlsMatch(
  expected: string,
  actual: string | null,
): boolean {
  if (!actual) return false;

  try {
    const expectedUrl = new URL(expected);
    const actualUrl = new URL(actual);
    return (
      expectedUrl.origin === actualUrl.origin &&
      expectedUrl.pathname.replace(/\/$/, "") ===
        actualUrl.pathname.replace(/\/$/, "")
    );
  } catch {
    return false;
  }
}

export function formatAuthRedirectMismatchMessage(
  expected: string,
  actual: string | null,
): string {
  return [
    "ログインの戻り先がこの端末と一致しません。",
    `この端末: ${expected}`,
    `Supabase 側: ${actual ?? "（取得できませんでした）"}`,
    "Supabase → Authentication → URL Configuration の Redirect URLs に、上の「この端末」と同じ URL を追加してください。",
  ].join("\n");
}
