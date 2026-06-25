"use client";

import { EntranceFlow } from "@/components/entrance/entrance-flow";
import { LoadingGate } from "@/components/entrance/loading-gate";
import { useEntranceScrollLock } from "@/hooks/use-entrance-scroll-lock";
import type { LoadingGateSnapshot } from "@/lib/entrance/loading-gate-init";
import { useCallback, useState } from "react";

export function EntranceApp() {
  useEntranceScrollLock();

  const [isReady, setIsReady] = useState(false);
  const [gateSnapshot, setGateSnapshot] = useState<LoadingGateSnapshot | null>(
    null,
  );

  const handleGateReady = useCallback((snapshot: LoadingGateSnapshot) => {
    setGateSnapshot(snapshot);
    setIsReady(true);
  }, []);

  return (
    <div className="entrance-experience-root">
      <div className="stage-viewport">
        <div className="stage-viewport-fill">
          {!isReady || !gateSnapshot ? (
            <LoadingGate onReady={handleGateReady} />
          ) : (
            <EntranceFlow gateSnapshot={gateSnapshot} />
          )}
        </div>
      </div>
    </div>
  );
}
