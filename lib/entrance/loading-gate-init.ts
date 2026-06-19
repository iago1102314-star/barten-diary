import { isEntryImagePreloaded, preloadEntryImage } from "@/lib/entrance/entry-image-preload";
import { logLoadingGate } from "@/lib/entrance/loading-gate-log";
import { isReturningVisitor } from "@/lib/entrance/visit-state";

export type LoadingGateSnapshot = {
  isReturningVisitor: boolean;
  entryImagePreloaded: boolean;
};

type LoadingGatePhase = {
  id: string;
  run: () => Promise<void>;
};

function waitForNextFrame(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
}

function readVisitStateSnapshot(): Pick<LoadingGateSnapshot, "isReturningVisitor"> {
  return {
    isReturningVisitor: isReturningVisitor(),
  };
}

function buildSnapshot(
  visit: Pick<LoadingGateSnapshot, "isReturningVisitor">,
): LoadingGateSnapshot {
  return {
    ...visit,
    entryImagePreloaded: isEntryImagePreloaded(),
  };
}

async function runLoadingGatePhases(phases: LoadingGatePhase[]): Promise<void> {
  for (const phase of phases) {
    const startedAt = performance.now();
    logLoadingGate(`phase:start ${phase.id}`);

    await phase.run();

    logLoadingGate(`phase:done ${phase.id}`, {
      ms: Math.round(performance.now() - startedAt),
    });
  }
}

const LOADING_GATE_PHASES: LoadingGatePhase[] = [
  {
    id: "visit-state",
    run: async () => {
      readVisitStateSnapshot();
    },
  },
  {
    id: "entry-image",
    run: () => preloadEntryImage(),
  },
  {
    id: "main-thread-yield",
    run: () => waitForNextFrame(),
  },
];

/** Loading Gate — Audio / React 演出は触らない */
export async function runLoadingGateInit(): Promise<LoadingGateSnapshot> {
  const gateStartedAt = performance.now();
  logLoadingGate("gate:start");

  const visit = readVisitStateSnapshot();
  await runLoadingGatePhases(LOADING_GATE_PHASES);

  const snapshot = buildSnapshot(visit);

  logLoadingGate("gate:ready", {
    ms: Math.round(performance.now() - gateStartedAt),
    isReturningVisitor: snapshot.isReturningVisitor,
    entryImagePreloaded: snapshot.entryImagePreloaded,
  });

  return snapshot;
}

/** preload 失敗時 — visit state だけは可能な限り保持 */
export function readLoadingGateFallbackSnapshot(): LoadingGateSnapshot {
  return buildSnapshot(readVisitStateSnapshot());
}
