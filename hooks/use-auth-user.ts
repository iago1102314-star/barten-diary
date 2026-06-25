"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

/** クライアント — ログイン状態（将来の未ログイン入店にも対応） */
export function useAuthUser() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createClient();

    void supabase.auth.getUser().then(({ data }) => {
      setIsLoggedIn(Boolean(data.user));
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(Boolean(session?.user));
    });

    return () => subscription.unsubscribe();
  }, []);

  return {
    isLoggedIn: isLoggedIn ?? false,
    isLoading: isLoggedIn === null,
  };
}
