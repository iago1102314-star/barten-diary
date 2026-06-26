"use client";

import { useEffect, useState } from "react";

/** ログイン中ユーザーの夜のメモ件数 */
export function useUserDiaryCount(enabled: boolean) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    if (!enabled) {
      setCount(null);
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const response = await fetch(
          "/api/memories?page=0&includeCount=true&shelfListOnly=true",
        );
        if (!response.ok) {
          if (!cancelled) setCount(null);
          return;
        }
        const data = (await response.json()) as { totalCount?: number };
        if (!cancelled) {
          setCount(typeof data.totalCount === "number" ? data.totalCount : 0);
        }
      } catch {
        if (!cancelled) setCount(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return count;
}
