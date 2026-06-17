export type CounterLampGlowAnchor =
  | "lantern-left"
  | "lantern-right"
  | "back-lamp";

/** 確認用 — 赤点+座標ラベル（位置調整時のみ true） */
export const SHOW_LAMP_GLOW_DEBUG_MARKERS = false;

/** 本番 — 光本体を表示 */
export const SHOW_LAMP_GLOW_LIGHT = true;

/** ホーム画面 — 光の size / ratio / intensity をスライダー調整（true = セリフ進行を止める） */
export const LAMP_GLOW_SHAPE_EDIT_ON_HOME = false;

export function isLampGlowHomeEditing(): boolean {
  return LAMP_GLOW_SHAPE_EDIT_ON_HOME;
}

/** 親要素（ランタン画像 or 背景レイヤー）基準の LampGlow 設定 */
export type CounterLampGlowConfig = {
  id: string;
  label: string;
  anchor: CounterLampGlowAnchor;
  /** 親要素内 X (%) — 光源中心（確定） */
  offsetX: number;
  /** 親要素内 Y (%) — 光源中心（確定） */
  offsetY: number;
  /** 親要素幅に対するグロー幅 (%) */
  size: number;
  /** 縦横比 (1 = 円) */
  ratio: number;
  tone: "warm" | "cold" | "neon";
  /** 光色上書き — "r, g, b"（0〜255） */
  colorRgb?: string;
  /** 光の強度 0〜3（1 超でより強く） */
  intensity: number;
  /** @deprecated 呼吸周期は lib/entrance/lamp-glow-breathe.ts を参照 */
  speed: string;
};

/**
 * カウンター店内 — アンカー付き LampGlow 3 点
 *
 * 【書き込み場所】この COUNTER_LAMP_GLOWS 配列を直接編集する。
 * 光調整UI → ①コピー → ここに貼り付け → 保存 → ②反映。
 * offsetX/Y は確定済み。主に size / ratio / intensity / speed を更新。
 */
export const COUNTER_LAMP_GLOWS: CounterLampGlowConfig[] = [
  {
    id: "lantern-left",
    label: "左ランタン先端",
    anchor: "lantern-left",
    offsetX: 49,
    offsetY: 60,
    size: 233,
    ratio: 1.87,
    tone: "warm",
    intensity: 0.4,
    speed: "5.5s",
  },
  {
    id: "lantern-right",
    label: "右ランタン先端",
    anchor: "lantern-right",
    offsetX: 49,
    offsetY: 60,
    size: 233,
    ratio: 1.87,
    tone: "warm",
    intensity: 0.4,
    speed: "5.5s",
  },
  {
    id: "back-lamp",
    label: "背景右の照明",
    anchor: "back-lamp",
    offsetX: 12,
    offsetY: 39,
    size: 118,
    ratio: 0.6,
    tone: "warm",
    intensity: 0.2,
    speed: "12.1s",
  },
];

export function mapGlowsByAnchor(
  glows: CounterLampGlowConfig[] = COUNTER_LAMP_GLOWS,
): Record<CounterLampGlowAnchor, CounterLampGlowConfig | undefined> {
  const map: Record<CounterLampGlowAnchor, CounterLampGlowConfig | undefined> = {
    "lantern-left": undefined,
    "lantern-right": undefined,
    "back-lamp": undefined,
  };

  for (const glow of glows) {
    map[glow.anchor] = glow;
  }

  return map;
}
