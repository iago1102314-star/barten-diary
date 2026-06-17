import {
  isLampGlowTone,
  type LampGlowShapeFields,
} from "@/lib/entrance/lamp-glow-types";
import {
  START_BOKEH_LAMP_GLOWS,
  type StartBokehLampGlowConfig,
  type StartBokehLampGlowShapeFields,
} from "@/lib/entrance/start-bokeh-lamp-glows";

const STORAGE_KEY = "barten-start-bokeh-lamp-glow-overrides";

function cloneGlows(
  glows: StartBokehLampGlowConfig[],
): StartBokehLampGlowConfig[] {
  return glows.map((glow) => ({ ...glow }));
}

function isValidOverrides(value: unknown): value is StartBokehLampGlowConfig[] {
  if (!Array.isArray(value) || value.length !== START_BOKEH_LAMP_GLOWS.length) {
    return false;
  }

  const expectedIds = new Set(START_BOKEH_LAMP_GLOWS.map((glow) => glow.id));
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

export function loadStartBokehLampGlowOverrides(): StartBokehLampGlowConfig[] | null {
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

export function saveStartBokehLampGlowOverrides(
  glows: StartBokehLampGlowConfig[],
): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(glows));
}

export function clearStartBokehLampGlowOverrides(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

export function mergeStartBokehLampGlowsForShapeEdit(): StartBokehLampGlowConfig[] {
  const draft = loadStartBokehLampGlowOverrides();

  return START_BOKEH_LAMP_GLOWS.map((fileGlow) => {
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
export function applyStartBokehLampGlowShapePatch(
  glows: StartBokehLampGlowConfig[],
  id: string,
  patch: Partial<StartBokehLampGlowShapeFields>,
): StartBokehLampGlowConfig[] {
  const fileById = new Map(START_BOKEH_LAMP_GLOWS.map((glow) => [glow.id, glow]));

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
