import { getRequestOriginFromRequest } from "@/lib/auth/request-origin";
import { sanitizeAuthNextPath } from "@/lib/auth/auth-callback-url";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const origin = getRequestOriginFromRequest(request);
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = sanitizeAuthNextPath(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }

    const loginUrl = new URL(`${origin}/login`);
    loginUrl.searchParams.set("error", "auth");
    if (process.env.NODE_ENV === "development") {
      loginUrl.searchParams.set("detail", error.message);
    }
    return NextResponse.redirect(loginUrl.toString());
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
