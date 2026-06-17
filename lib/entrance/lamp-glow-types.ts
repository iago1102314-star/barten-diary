export type LampGlowTone = "warm" | "cold" | "neon";

export const LAMP_GLOW_TONES: LampGlowTone[] = ["warm", "cold", "neon"];

export function isLampGlowTone(value: unknown): value is LampGlowTone {
  return value === "warm" || value === "cold" || value === "neon";
}

export type LampGlowShapeFields = {
  size: number;
  ratio: number;
  intensity: number;
  tone: LampGlowTone;
};

/** 親要素（背景画像レイヤー等）基準の LampGlow 設定 — 共通フィールド */
export type LampGlowConfigBase = {
  id: string;
  label: string;
  /** 親要素内 X (%) — 光源中心 */
  offsetX: number;
  /** 親要素内 Y (%) — 光源中心 */
  offsetY: number;
  /** 親要素幅に対するグロー幅 (%) */
  size: number;
  /** 縦横比 (1 = 円) */
  ratio: number;
  tone: LampGlowTone;
  /** 光色上書き — "r, g, b"（0〜255）。通常は lib/entrance/lamp-glow-color.ts の既定色 */
  colorRgb?: string;
  /** 光の強度 0〜3（1 超でより強く） */
  intensity: number;
  /** @deprecated 呼吸周期は各 *-lamp-glow-breathe.ts を参照 */
  speed: string;
};
