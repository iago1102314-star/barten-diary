import type { LampGlowTone } from "@/lib/entrance/lamp-glow-types";

/** tone ごとの既定 RGB — "r, g, b" */
export const DEFAULT_LAMP_GLOW_RGB: Record<LampGlowTone, string> = {
  warm: "220, 118, 26",
  cold: "176, 206, 226",
  neon: "120, 196, 214",
};

export function parseColorRgb(
  value: string | undefined,
): [number, number, number] | null {
  if (!value) return null;

  const parts = value.split(",").map((part) => Number.parseInt(part.trim(), 10));
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return null;

  return [
    clampRgbChannel(parts[0]),
    clampRgbChannel(parts[1]),
    clampRgbChannel(parts[2]),
  ];
}

export function formatColorRgb(r: number, g: number, b: number): string {
  return `${clampRgbChannel(r)}, ${clampRgbChannel(g)}, ${clampRgbChannel(b)}`;
}

export function clampRgbChannel(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

/** colorRgb があれば上書き、なければ tone 既定 */
export function resolveLampGlowRgb(
  tone: LampGlowTone,
  colorRgb?: string,
): string {
  const parsed = parseColorRgb(colorRgb);
  if (parsed) return formatColorRgb(...parsed);
  return DEFAULT_LAMP_GLOW_RGB[tone];
}

/** 2 つの光色を t (0〜1) で補間 — 移行演出用 */
export function lerpLampGlowRgb(
  toneA: LampGlowTone,
  colorA: string | undefined,
  toneB: LampGlowTone,
  colorB: string | undefined,
  t: number,
): string {
  const clamped = Math.max(0, Math.min(1, t));
  const a = parseColorRgb(resolveLampGlowRgb(toneA, colorA))!;
  const b = parseColorRgb(resolveLampGlowRgb(toneB, colorB))!;

  return formatColorRgb(
    a[0] + (b[0] - a[0]) * clamped,
    a[1] + (b[1] - a[1]) * clamped,
    a[2] + (b[2] - a[2]) * clamped,
  );
}

/** 編集UI — tone 既定と同値なら TS 省略可 */
export function normalizeColorRgbForTone(
  tone: LampGlowTone,
  colorRgb: string | undefined,
): string | undefined {
  if (!colorRgb) return undefined;
  const parsed = parseColorRgb(colorRgb);
  if (!parsed) return undefined;

  const normalized = formatColorRgb(...parsed);
  return normalized === DEFAULT_LAMP_GLOW_RGB[tone] ? undefined : normalized;
}

export function isValidColorRgb(value: unknown): value is string {
  return typeof value === "string" && parseColorRgb(value) != null;
}
