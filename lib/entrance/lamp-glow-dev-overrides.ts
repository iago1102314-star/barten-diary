import {
  isLampGlowTone,
  type LampGlowShapeFields,
} from "@/lib/entrance/lamp-glow-types";
import {
  COUNTER_LAMP_GLOWS,
  type CounterLampGlowConfig,
} from "@/lib/entrance/counter-lamp-glows";

export type { LampGlowShapeFields };

const STORAGE_KEY = "barten-lamp-glow-overrides";

function cloneGlows(glows: CounterLampGlowConfig[]): CounterLampGlowConfig[] {
  return glows.map((glow) => ({ ...glow }));
}

function isValidOverrides(value: unknown): value is CounterLampGlowConfig[] {
  if (!Array.isArray(value) || value.length !== COUNTER_LAMP_GLOWS.length) {
    return false;
  }

  const expectedIds = new Set(COUNTER_LAMP_GLOWS.map((glow) => glow.id));
  return value.every(
    (item) =>
      item &&
      typeof item === "object" &&
      typeof item.id === "string" &&
      expectedIds.has(item.id) &&
      typeof item.offsetX === "number" &&
      typeof item.offsetY === "number" &&
      typeof item.size === "number" &&
      typeof item.ratio === "number" &&
      typeof item.intensity === "number",
  );
}

/** 編集中の下書き（localStorage）— 確定値は counter-lamp-glows.ts */
export function loadLampGlowOverrides(): CounterLampGlowConfig[] | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed: unknown = JSON.parse(raw);
    if (!isValidOverrides(parsed)) return null;

    return cloneGlows(parsed);
  } catch {
    return null;
  }
}

export function saveLampGlowOverrides(glows: CounterLampGlowConfig[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(glows));
}

export function clearLampGlowOverrides(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

/** 編集セッション開始時 — 下書きがあれば復元、なければ TS 既定値 */
export function getLampGlowDraft(): CounterLampGlowConfig[] {
  return loadLampGlowOverrides() ?? cloneGlows(COUNTER_LAMP_GLOWS);
}

/** 光調整用 — 座標は TS ファイル固定、size/ratio/intensity のみ下書きから復元 */
export function mergeLampGlowsForShapeEdit(): CounterLampGlowConfig[] {
  const draft = loadLampGlowOverrides();

  return COUNTER_LAMP_GLOWS.map((fileGlow) => {
    const draftGlow = draft?.find((item) => item.id === fileGlow.id);
    if (!draftGlow) return { ...fileGlow };

    return {
      ...fileGlow,
      size: Math.max(1, draftGlow.size),
      ratio: Math.max(0.05, draftGlow.ratio),
      intensity: Math.max(0, Math.min(3, draftGlow.intensity)),
      tone: isLampGlowTone(draftGlow.tone) ? draftGlow.tone : fileGlow.tone,
    };
  });
}

/** 光調整パッチ — offsetX/Y は常に TS ファイルの値を維持 */
export function applyLampGlowShapePatch(
  glows: CounterLampGlowConfig[],
  id: string,
  patch: Partial<LampGlowShapeFields>,
): CounterLampGlowConfig[] {
  const fileById = new Map(COUNTER_LAMP_GLOWS.map((glow) => [glow.id, glow]));

  return glows.map((glow) => {
    const fileGlow = fileById.get(glow.id);
    if (!fileGlow) return glow;

    const locked = {
      offsetX: fileGlow.offsetX,
      offsetY: fileGlow.offsetY,
    };

    if (glow.id !== id) {
      return { ...glow, ...locked };
    }

    return { ...glow, ...patch, ...locked };
  });
}

/** @deprecated getLampGlowDraft を使う（ファイルが正） */
export function getEffectiveLampGlows(): CounterLampGlowConfig[] {
  return cloneGlows(COUNTER_LAMP_GLOWS);
}
