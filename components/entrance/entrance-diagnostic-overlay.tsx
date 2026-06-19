"use client";

import dynamic from "next/dynamic";

const RecordingPipelineDiagnosticPanel = dynamic(
  () =>
    import("@/components/entrance/recording-pipeline-diagnostic-panel").then(
      (mod) => mod.RecordingPipelineDiagnosticPanel,
    ),
  { ssr: false },
);

export function EntranceDiagnosticOverlay() {
  return <RecordingPipelineDiagnosticPanel />;
}
