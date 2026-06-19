import { isEntryImagePreloaded, preloadEntryImage } from "@/lib/entrance/entry-image-preload";
import { logLoadingGate } from "@/lib/entrance/loading-gate-log";
import { isReturningVisitor } from "@/lib/entrance/visit-state";

export type LoadingGateSnapshot = {
  isReturningVisitor: boolean;
  entryImagePreloaded: boolean;
};

/** UX — ロード完了後もこの時間は Gate を維持（実ロードが長い場合はそちらを優先） */
export const LOADING_GATE_MIN_DISPLAY_MS = 3000;

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

async function waitForMinimumGateDisplay(gateStartedAt: number): Promise<void> {
  const remaining = LOADING_GATE_MIN_DISPLAY_MS - (performance.now() - gateStartedAt);
  if (remaining <= 0) return;

  logLoadingGate("min-display:wait", { ms: Math.round(remaining) });
  await new Promise((resolve) => setTimeout(resolve, remaining));
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
  logLoadingGate("gate:start", { minDisplayMs: LOADING_GATE_MIN_DISPLAY_MS });

  let snapshot: LoadingGateSnapshot;

  try {
    const visit = readVisitStateSnapshot();
    await runLoadingGatePhases(LOADING_GATE_PHASES);
    snapshot = buildSnapshot(visit);
  } catch {
    snapshot = readLoadingGateFallbackSnapshot();
    logLoadingGate("gate:fallback-snapshot");
  }

  await waitForMinimumGateDisplay(gateStartedAt);

  logLoadingGate("gate:ready", {
    ms: Math.round(performance.now() - gateStartedAt),
    minDisplayMs: LOADING_GATE_MIN_DISPLAY_MS,
    isReturningVisitor: snapshot.isReturningVisitor,
    entryImagePreloaded: snapshot.entryImagePreloaded,
  });

  return snapshot;
}

/** preload 失敗時 — visit state だけは可能な限り保持 */
export function readLoadingGateFallbackSnapshot(): LoadingGateSnapshot {
  return buildSnapshot(readVisitStateSnapshot());
}
