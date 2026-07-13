"use client";

import {
  bootstrapBehaviorVisit,
  captureBehaviorRefFromUrl,
  clearBehaviorAdminCache,
  logBehaviorAccessOnce,
  logBehaviorEvent,
  resolveBehaviorLogContext,
} from "@/lib/analytics/behavior-log";
import { setupVisitLifecycle } from "@/lib/analytics/visit-lifecycle";
import { createClient } from "@/lib/supabase/client";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

function BehaviorLogInitInner() {
  const searchParams = useSearchParams();
  const searchKey = searchParams.toString();

  useEffect(() => {
    const navigationSearch =
      typeof window !== "undefined" ? window.location.search : "";

    captureBehaviorRefFromUrl(navigationSearch);

    void (async () => {
      await bootstrapBehaviorVisit(navigationSearch);
      await logBehaviorAccessOnce(navigationSearch);
    })();

    const cleanupLifecycle = setupVisitLifecycle({
      resolveContext: resolveBehaviorLogContext,
    });

    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        clearBehaviorAdminCache();
        void logBehaviorEvent("login_success");
      }
      if (event === "SIGNED_OUT") {
        clearBehaviorAdminCache();
      }
    });

    return () => {
      cleanupLifecycle();
      subscription.unsubscribe();
    };
  }, [searchKey]);

  return null;
}

/** UI なし — visitor/visit 初期化・アクセスログ・離脱計測・ログインイベント */
export function BehaviorLogInit() {
  return (
    <Suspense fallback={null}>
      <BehaviorLogInitInner />
    </Suspense>
  );
}
