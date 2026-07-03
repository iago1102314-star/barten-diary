"use client";

import {
  captureBehaviorRefFromUrl,
  logBehaviorAccessOnce,
  logBehaviorEvent,
} from "@/lib/analytics/behavior-log";
import { createClient } from "@/lib/supabase/client";
import { useEffect } from "react";

/** UI なし — session/ref 初期化・アクセスログ・ログインイベント */
export function BehaviorLogInit() {
  useEffect(() => {
    captureBehaviorRefFromUrl();
    void logBehaviorAccessOnce();

    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        void logBehaviorEvent("login_success");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return null;
}
