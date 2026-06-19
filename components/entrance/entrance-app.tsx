"use client";

import { EntranceFlow } from "@/components/entrance/entrance-flow";
import { LoadingGate } from "@/components/entrance/loading-gate";
import type { LoadingGateSnapshot } from "@/lib/entrance/loading-gate-init";
import { useCallback, useState } from "react";

export function EntranceApp() {
  const [isReady, setIsReady] = useState(false);
  const [gateSnapshot, setGateSnapshot] = useState<LoadingGateSnapshot | null>(
    null,
  );

  const handleGateReady = useCallback((snapshot: LoadingGateSnapshot) => {
    setGateSnapshot(snapshot);
    setIsReady(true);
  }, []);

  if (!isReady || !gateSnapshot) {
    return <LoadingGate onReady={handleGateReady} />;
  }

  return (
    <div className="stage-viewport">
      <EntranceFlow gateSnapshot={gateSnapshot} />
    </div>
  );
}
