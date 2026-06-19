"use client";

import { RecordingPipelineDiagnosticPanel } from "@/components/entrance/recording-pipeline-diagnostic-panel";
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
      {!isReady || !gateSnapshot ? (
        <LoadingGate onReady={handleGateReady} />
      ) : (
        <div className="stage-viewport">
          <div className="stage-viewport-fill">
            <EntranceFlow gateSnapshot={gateSnapshot} />
          </div>
        </div>
      )}
      <RecordingPipelineDiagnosticPanel />
    </div>
  );
}
