/** 光の見た目 — intensity は 0〜3（1 超でより強く） */

/**
 * ボケ玉グラデーション — 実際のレンズボケに近い硬い縁
 * 中心から均一に明るく、縁付近で急落下。
 */
export function buildBokehGlowBackground(rgb: string, intensity: number): string {
  const clamped = Math.max(0, Math.min(3, intensity));
  const core = Math.min(1, clamped);
  const boost = clamped > 1 ? (clamped - 1) * 0.5 : 0;

  const center = Math.min(1, core * 0.95 + boost * 0.45);
  const stop45 = Math.min(1, core * 0.87 + boost * 0.38);
  const stop68 = Math.min(1, core * 0.46 + boost * 0.32);
  const edge = Math.min(1, core * 0.12 + boost * 0.22);

  return [
    `radial-gradient(circle at 50% 50%,`,
    `  rgba(${rgb}, ${center.toFixed(3)}) 0%,`,
    `  rgba(${rgb}, ${stop45.toFixed(3)}) 45%,`,
    `  rgba(${rgb}, ${stop68.toFixed(3)}) 68%,`,
    `  rgba(${rgb}, ${edge.toFixed(3)}) 82%,`,
    `  transparent 94%)`,
  ].join(" ");
}

/** ボケ玉全体の不透明度 — 0〜1 は弱め、1超は定常グローと同系統で強調 */
export function bokehOrbElementOpacity(intensity: number): number {
  const clamped = Math.max(0, Math.min(3, intensity));
  if (clamped <= 1) return 0.25 + clamped * 0.55;
  return Math.min(1.85, 0.55 + clamped * 0.45);
}

export function buildLampGlowBackground(
  rgb: string,
  intensity: number,
): string {
  const core = Math.min(1, intensity);
  const boost = intensity > 1 ? (intensity - 1) * 0.5 : 0;

  return `radial-gradient(ellipse 50% 50% at 50% 50%, rgba(${rgb}, ${Math.min(1, core + boost)}) 0%, rgba(${rgb}, ${Math.min(1, core * 0.4 + boost * 0.7)}) 35%, rgba(${rgb}, ${Math.min(1, core * 0.12 + boost * 0.35)}) 58%, transparent 88%)`;
}

export function lampGlowElementOpacity(intensity: number): number {
  if (intensity <= 1) return 1;
  return Math.min(1.85, 0.55 + intensity * 0.45);
}

export const LAMP_GLOW_INTENSITY_MAX = 3;
