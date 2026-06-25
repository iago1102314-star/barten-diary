import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { LoginAuthDiagnostics } from "@/components/auth/login-auth-diagnostics";
import { LoginPageShell } from "@/components/auth/login-page-shell";
import { createClient } from "@/lib/supabase/server";
import { isLocal } from "@/lib/env/app-env";
import { redirect } from "next/navigation";

type LoginPageProps = {
  searchParams: Promise<{ error?: string; detail?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/");
  }

  const { error, detail } = await searchParams;
  const showAuthError = error === "auth";

  return (
    <LoginPageShell>
      <div className="w-full max-w-sm space-y-8 text-center">
        <header className="space-y-3">
          <p className="text-[11px] tracking-[0.35em] text-stone-600 uppercase">
            back bar
          </p>
          <h1 className="font-app-title text-xl font-normal tracking-[0.18em] text-stone-300">
            扉を開ける
          </h1>
          <p className="font-serif-jp text-sm leading-relaxed text-stone-500">
            静かなカウンターへ。
          </p>
        </header>

        {showAuthError && (
          <div
            role="alert"
            className="space-y-2 rounded-xl border border-red-900/40 bg-red-950/20 px-4 py-3 text-left text-sm text-red-300/80"
          >
            <p>入れませんでした。もう一度お試しください。</p>
            {isLocal && detail ? (
              <p className="whitespace-pre-wrap text-xs text-red-200/70">
                開発用詳細: {detail}
              </p>
            ) : null}
          </div>
        )}

        <GoogleSignInButton />
        {isLocal ? <LoginAuthDiagnostics /> : null}
      </div>
    </LoginPageShell>
  );
}
