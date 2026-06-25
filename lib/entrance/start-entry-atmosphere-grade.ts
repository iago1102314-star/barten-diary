import type { StartLampGlowConfig } from "@/lib/entrance/start-lamp-glows";
import { resolveLampGlowRgb } from "@/lib/entrance/lamp-glow-color";

/**
 * ホーム路地 — 画像の上に載せる露出・暖色グレード（光源は増やさない）
 */
export const START_ENTRY_ATMOSPHERE_GRADE = {
  /** ① ランタン光の届き — soft-light で写真側だけ 5〜8% 持ち上げ */
  lanternReach: {
    /** 光の広がり（各 size に対する倍率） */
    spreadScale: 1.42,
    /** グラデ中心の alpha */
    peakAlpha: 0.13,
    /** 中間リングの alpha 比率 */
    midAlphaRatio: 0.38,
    /** レイヤー全体 opacity */
    layerOpacity: 0.56,
    falloffPercent: 78,
  },
  /** ② 扉付近 — 黒潰れを戻し「中に暖かい空気」 */
  doorLift: {
    centerXPercent: 74,
    centerYPercent: 39,
    widthPercent: 40,
    heightPercent: 34,
    warmRgb: "255, 228, 198",
    peakAlpha: 0.17,
    midAlpha: 0.05,
    layerOpacity: 0.62,
    blendMode: "soft-light" as const,
  },
  /** ③ 右バー周辺 — 既存暖色ランタンを引き立てるごく弱い補正 */
  barWarm: {
    centerXPercent: 87,
    centerYPercent: 47,
    widthPercent: 52,
    heightPercent: 68,
    warmRgb: "194, 148, 86",
    peakAlpha: 0.07,
    layerOpacity: 0.48,
    blendMode: "screen" as const,
  },
  /** 青み乗算 — /20 からわずかに弱める（全体は明るくしない） */
  blueWashRgb: "10, 16, 32",
  blueWashOpacity: 0.17,
  /** 縦グラデ — 上の暗幕をほんの少しだけ緩める */
  verticalTopWashOpacity: 0.34,
  verticalBottomWashOpacity: 0.78,
} as const;

const G = START_ENTRY_ATMOSPHERE_GRADE;

export function buildLanternReachLiftBackground(
  glows: StartLampGlowConfig[],
): string {
  const { spreadScale, peakAlpha, midAlphaRatio, falloffPercent } =
    G.lanternReach;

  return glows
    .map((glow) => {
      const rgb = resolveLampGlowRgb(glow.tone, glow.colorRgb);
      const w = glow.size * spreadScale;
      const h = w * glow.ratio;
      const mid = peakAlpha * midAlphaRatio;
      return [
        `radial-gradient(ellipse ${w}% ${h}% at ${glow.offsetX}% ${glow.offsetY}%,`,
        `rgba(${rgb}, ${peakAlpha}) 0%,`,
        `rgba(${rgb}, ${mid}) 54%,`,
        `transparent ${falloffPercent}%)`,
      ].join("");
    })
    .join(", ");
}

export function buildDoorLiftBackground(): string {
  const d = G.doorLift;
  return [
    `radial-gradient(ellipse ${d.widthPercent}% ${d.heightPercent}% at ${d.centerXPercent}% ${d.centerYPercent}%,`,
    `rgba(${d.warmRgb}, ${d.peakAlpha}) 0%,`,
    `rgba(${d.warmRgb}, ${d.midAlpha}) 46%,`,
    `transparent 74%)`,
  ].join("");
}

export function buildBarWarmBackground(): string {
  const b = G.barWarm;
  return [
    `radial-gradient(ellipse ${b.widthPercent}% ${b.heightPercent}% at ${b.centerXPercent}% ${b.centerYPercent}%,`,
    `rgba(${b.warmRgb}, ${b.peakAlpha}) 0%,`,
    `transparent 68%)`,
  ].join("");
}
