import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/");
  }

  const { error } = await searchParams;
  const showAuthError = error === "auth";

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm space-y-8 text-center">
        <header className="space-y-3">
          <p className="text-[11px] tracking-[0.35em] text-stone-600 uppercase">
            back bar
          </p>
          <h1 className="text-lg font-light tracking-wide text-stone-300">
            扉を開ける
          </h1>
          <p className="text-sm leading-relaxed text-stone-500">
            静かなカウンターへ。
          </p>
        </header>

        {showAuthError && (
          <p
            role="alert"
            className="rounded-xl border border-red-900/40 bg-red-950/20 px-4 py-3 text-sm text-red-300/80"
          >
            入れませんでした。もう一度お試しください。
          </p>
        )}

        <GoogleSignInButton />
      </div>
    </div>
  );
}
