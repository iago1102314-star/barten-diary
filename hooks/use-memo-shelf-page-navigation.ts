"use client";

import { useBarAudio } from "@/hooks/use-bar-audio";
import { useCallback, useRef, useState } from "react";

type UseMemoShelfPageNavigationOptions = {
  page: number;
  hasMore: boolean;
  loading?: boolean;
  enabled?: boolean;
};

export function useMemoShelfPageNavigation({
  page,
  hasMore,
  loading = false,
  enabled = true,
}: UseMemoShelfPageNavigationOptions) {
  const audio = useBarAudio();
  const goToPageRef = useRef<((nextPage: number) => void) | null>(null);
  const [transitioning, setTransitioning] = useState(false);

  const navigationLocked = !enabled || loading || transitioning;

  const registerGoToPage = useCallback(
    (handler: ((nextPage: number) => void) | null) => {
      goToPageRef.current = handler;
    },
    [],
  );

  const goToPage = useCallback(
    (nextPage: number) => {
      if (navigationLocked) return;
      if (nextPage === page) return;
      if (nextPage < 0) return;
      if (nextPage > page && !hasMore) return;
      if (nextPage < page && page <= 0) return;
      goToPageRef.current?.(nextPage);
    },
    [hasMore, navigationLocked, page],
  );

  const playPageSound = useCallback(() => {
    audio.playPage();
  }, [audio]);

  return {
    goToPage,
    transitioning,
    setTransitioning,
    registerGoToPage,
    playPageSound,
  };
}
