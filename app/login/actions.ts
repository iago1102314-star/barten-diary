"use server";

import { buildAuthCallbackUrl } from "@/lib/auth/auth-callback-url";
import { getRequestOriginFromHeaders } from "@/lib/auth/request-origin";
import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export type SignInWithGoogleState = {
  error: string | null;
};

export async function signInWithGoogleAction(
  _prevState: SignInWithGoogleState,
): Promise<SignInWithGoogleState> {
  try {
    const origin = getRequestOriginFromHeaders(await headers());
    const callbackUrl = buildAuthCallbackUrl(origin);
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callbackUrl,
        skipBrowserRedirect: true,
      },
    });

    if (error) {
      return { error: error.message };
    }

    if (!data.url) {
      return { error: "OAuth URL が取得できませんでした" };
    }

    redirect(data.url);
  } catch (error) {
    if (isNextRedirectError(error)) {
      throw error;
    }

    const message =
      error instanceof Error ? error.message : "ログインを開始できませんでした";
    return { error: message };
  }
}

function isNextRedirectError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof error.digest === "string" &&
    error.digest.startsWith("NEXT_REDIRECT")
  );
}
