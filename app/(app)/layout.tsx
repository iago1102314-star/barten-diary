import { SignOutButton } from "@/components/auth/sign-out-button";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-stone-800/60 bg-stone-950/40 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-xl items-center justify-between gap-4 px-6 py-4">
          <Link
            href="/diaries"
            className="text-xs tracking-[0.2em] text-stone-500 uppercase transition-colors hover:text-stone-400"
          >
            back bar
          </Link>
          <SignOutButton />
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
