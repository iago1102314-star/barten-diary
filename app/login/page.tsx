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
      <div className="w-full max-w-sm space-y-8">
        <header className="space-y-2 text-center">
          <p className="text-sm font-medium tracking-wide text-zinc-500 uppercase">
            バーテン日記
          </p>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            ログイン
          </h1>
          <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            Google アカウントでサインインしてください。
          </p>
        </header>

        {showAuthError && (
          <p
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200"
          >
            ログインに失敗しました。もう一度お試しください。
          </p>
        )}

        <GoogleSignInButton />
      </div>
    </div>
  );
}
