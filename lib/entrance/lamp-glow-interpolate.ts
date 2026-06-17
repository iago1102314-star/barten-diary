import { lerpLampGlowRgb } from "@/lib/entrance/lamp-glow-color";
import type { StartBokehLampGlowConfig } from "@/lib/entrance/start-bokeh-lamp-glows";
import type { StartLampGlowConfig } from "@/lib/entrance/start-lamp-glows";

export function lerpNumber(from: number, to: number, t: number): number {
  return from + (to - from) * t;
}

/** ボケ → 定常の見た目パラメータを t (0〜1) で補間 */
export type InterpolatedStartGlowVisual = {
  offsetX: number;
  offsetY: number;
  size: number;
  ratio: number;
  intensity: number;
  rgb: string;
  /** 0 = ボケ玉グラデーション, 1 = 定常グローグラデーション */
  steadyWeight: number;
  /** px — ボケ filter 2 → 定常 LampGlow 10 */
  blurPx: number;
};

/** 定常 LampGlow と同じぼかし（px） */
export const START_STEADY_GLOW_BLUR_PX = 10;

/** size は移行の最後だけ変化 — 中盤の拡散を防ぐ */
const SIZE_LERP_START = 0.82;

export function interpolateStartGlowVisual(
  bokeh: StartBokehLampGlowConfig,
  steady: StartLampGlowConfig,
  t: number,
): InterpolatedStartGlowVisual {
  const clamped = Math.max(0, Math.min(1, t));
  const sizeT =
    clamped <= SIZE_LERP_START
      ? 0
      : (clamped - SIZE_LERP_START) / (1 - SIZE_LERP_START);

  return {
    offsetX: lerpNumber(bokeh.offsetX, steady.offsetX, clamped),
    offsetY: lerpNumber(bokeh.offsetY, steady.offsetY, clamped),
    size: lerpNumber(bokeh.size, steady.size, sizeT),
    ratio: lerpNumber(bokeh.ratio, steady.ratio, clamped),
    intensity: lerpNumber(bokeh.intensity, steady.intensity, clamped),
    rgb: lerpLampGlowRgb(
      bokeh.tone,
      bokeh.colorRgb,
      steady.tone,
      steady.colorRgb,
      clamped,
    ),
    steadyWeight: clamped,
    blurPx: lerpNumber(2, START_STEADY_GLOW_BLUR_PX, clamped),
  };
}

/** id でボケ・定常をペアリング */
export function pairStartGlowsById(
  bokehGlows: StartBokehLampGlowConfig[],
  steadyGlows: StartLampGlowConfig[],
): Array<{ bokeh: StartBokehLampGlowConfig; steady: StartLampGlowConfig }> {
  const steadyById = new Map(steadyGlows.map((glow) => [glow.id, glow]));

  return bokehGlows.flatMap((bokeh) => {
    const steady = steadyById.get(bokeh.id);
    return steady ? [{ bokeh, steady }] : [];
  });
}
