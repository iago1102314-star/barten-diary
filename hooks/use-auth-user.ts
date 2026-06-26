"use client";

import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

export type AuthUserProfile = {
  id: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
};

function mapAuthUser(user: User | null): AuthUserProfile | null {
  if (!user) return null;

  const metadata = user.user_metadata as Record<string, unknown> | undefined;
  const name =
    (typeof metadata?.full_name === "string" && metadata.full_name) ||
    (typeof metadata?.name === "string" && metadata.name) ||
    null;
  const avatarUrl =
    (typeof metadata?.avatar_url === "string" && metadata.avatar_url) ||
    (typeof metadata?.picture === "string" && metadata.picture) ||
    null;

  return {
    id: user.id,
    email: user.email ?? null,
    name,
    avatarUrl,
  };
}

/** クライアント — ログイン状態とプロフィール */
export function useAuthUser() {
  const [user, setUser] = useState<AuthUserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    const syncUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(mapAuthUser(data.user));
      setIsLoading(false);
    };

    void syncUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(mapAuthUser(session?.user ?? null));
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return {
    user,
    isLoggedIn: user !== null,
    isLoading,
  };
}
