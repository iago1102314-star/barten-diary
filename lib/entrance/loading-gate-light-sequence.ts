import { START_BOKEH_BACKGROUND_OPACITY } from "@/lib/entrance/start-bokeh-lamp-glows";
import {
  START_BOKEH_LAMP_GLOWS,
  START_BOKEH_ONLY_LAMP_GLOWS,
} from "@/lib/entrance/start-bokeh-lamp-glows";
import { START_LAMP_GLOWS } from "@/lib/entrance/start-lamp-glows";

/** 点灯順の確認用 — 赤い番号を画面に重ねる */
export const SHOW_LOADING_GATE_LIGHT_ORDER_MARKERS = false;

/**
 * 赤番号の対応表（マーカー表示用 — 並べ替えない）
 *
 *  1 alley-cold          街灯
 *  2 alley-cold-2        コンビニ
 *  3 bokeh-only-orange-5
 *  4 bokeh-only-orange-7
 *  5 bokeh-only-orange-2
 *  6 alley-neon          看板ネオン
 *  7 alley-neon-2
 *  8 bokeh-only-orange-6
 *  9 bokeh-only-orange-3
 * 10 bokeh-only-orange-4
 * 11 bokeh-only-orange-9
 * 12 bokeh-only-white-1
 * 13 bokeh-only-white-3
 * 14 bokeh-only-neon-1
 * 15 bokeh-only-white-2
 * 16 alley-warm-right     暖色右
 * 17 bokeh-only-white-4
 * 18 bokeh-only-orange-1
 * 19 alley-warm-left      暖色左
 * 20 bokeh-only-orange-8
 * 21 bokeh-only-neon-2
 * 22 alley-door-warm      扉・暖色（バー）
 */
export const LOADING_GATE_LIGHT_ORDER = [
  "alley-cold",
  "alley-cold-2",
  "bokeh-only-orange-5",
  "bokeh-only-orange-7",
  "bokeh-only-orange-2",
  "alley-neon",
  "alley-neon-2",
  "bokeh-only-orange-6",
  "bokeh-only-orange-3",
  "bokeh-only-orange-4",
  "bokeh-only-orange-9",
  "bokeh-only-white-1",
  "bokeh-only-white-3",
  "bokeh-only-neon-1",
  "bokeh-only-white-2",
  "alley-warm-right",
  "bokeh-only-white-4",
  "bokeh-only-orange-1",
  "alley-warm-left",
  "bokeh-only-orange-8",
  "bokeh-only-neon-2",
  "alley-door-warm",
] as const;

export type LoadingGateLightId = (typeof LOADING_GATE_LIGHT_ORDER)[number];

/**
 * 点灯グループ — 各配列内は同時、上から順に灯る
 *
 * ① 3,4,5,8,9,10 同時
 * ② 21,17,15,18 同時
 * ③ 13,14,12,7,11,6 同時
 * ④ 2
 * ⑤ 1
 * ⑥ 16,19,20,22 同時で完了
 */
export const LOADING_GATE_LIGHT_GROUPS: LoadingGateLightId[][] = [
  [
    "bokeh-only-orange-5",
    "bokeh-only-orange-7",
    "bokeh-only-orange-2",
    "bokeh-only-orange-6",
    "bokeh-only-orange-3",
    "bokeh-only-orange-4",
  ],
  [
    "bokeh-only-neon-2",
    "bokeh-only-white-4",
    "bokeh-only-white-2",
    "bokeh-only-orange-1",
  ],
  [
    "bokeh-only-white-3",
    "bokeh-only-neon-1",
    "bokeh-only-white-1",
    "alley-neon-2",
    "bokeh-only-orange-9",
    "alley-neon",
  ],
  ["alley-cold-2"],
  ["alley-cold"],
  [
    "alley-warm-right",
    "alley-warm-left",
    "bokeh-only-orange-8",
    "alley-door-warm",
  ],
];

/** 各グループの点灯開始（ms）— 0.4 / 0.9 / 1.4 / 2.0 秒の段階感 */
export const LOADING_GATE_LIGHT_GROUP_START_MS: readonly number[] = [
  0,
  400,
  900,
  1400,
  1700,
  2000,
];

/** 1グループがじわっと灯る時間（ms） */
export const LOADING_GATE_LIGHT_FADE_MS = 1000;

/** 最終グループ（バー暖色）— 余韻を残すため同じフェード長 */
export const LOADING_GATE_LAST_GROUP_FADE_MS = 1000;

/**
 * 路地が見え始める灯り累積しきい値（0〜1）
 * これより前は黒＋光のみ、中盤から路地をグッと露出
 */
export const LOADING_GATE_ALLEY_REVEAL_LIT_START = 0.28;

/** 路地露出カーブ — 小さいほど終盤でグッと明るく */
export const LOADING_GATE_ALLEY_REVEAL_EASE_POWER = 0.72;

export const LOADING_GATE_LIGHT_COUNT = LOADING_GATE_LIGHT_ORDER.length;

export const LOADING_GATE_LIGHT_GROUP_COUNT = LOADING_GATE_LIGHT_GROUPS.length;

/** 点灯演出の総時間 — 最終グループが灯り切るまで */
export const LOADING_GATE_LIGHT_SEQUENCE_MS =
  LOADING_GATE_LIGHT_GROUP_START_MS[LOADING_GATE_LIGHT_GROUP_COUNT - 1]! +
  LOADING_GATE_LAST_GROUP_FADE_MS;

const loadingGateLightGroupIndex = new Map<string, number>(
  LOADING_GATE_LIGHT_GROUPS.flatMap((group, groupIndex) =>
    group.map((id) => [id, groupIndex] as const),
  ),
);

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

/** 滲むようにじわっと — 序盤は極やわらか、中盤からゆっくり満ちる */
function easeBloomAppear(t: number): number {
  const x = clamp01(t);
  const drift = x ** 3.6;
  const smooth = x * x * (3 - 2 * x);
  return clamp01(drift * 0.5 + smooth * 0.5);
}

/** グループ単位の点灯強度 — グループ内は常に同一値 */
export function getLoadingGateGroupLightAppear(
  elapsedMs: number,
  groupIndex: number,
): number {
  const startMs = LOADING_GATE_LIGHT_GROUP_START_MS[groupIndex] ?? 0;
  if (elapsedMs < startMs) return 0;

  const fadeMs =
    groupIndex === LOADING_GATE_LIGHT_GROUP_COUNT - 1
      ? LOADING_GATE_LAST_GROUP_FADE_MS
      : LOADING_GATE_LIGHT_FADE_MS;
  const linear = clamp01((elapsedMs - startMs) / fadeMs);
  return easeBloomAppear(linear);
}

/** 灯 id → 0〜1 の点灯強度（同グループは同じタイミング） */
export function getLoadingGateLightAppear(
  lightId: string,
  elapsedMs: number,
): number {
  const groupIndex = loadingGateLightGroupIndex.get(lightId);
  if (groupIndex === undefined) return 0;

  return getLoadingGateGroupLightAppear(elapsedMs, groupIndex);
}

/** 灯りの累積 — 路地露出のトリガー */
export function getLoadingGateLightLitProgress(elapsedMs: number): number {
  let sum = 0;
  for (let groupIndex = 0; groupIndex < LOADING_GATE_LIGHT_GROUP_COUNT; groupIndex++) {
    sum += getLoadingGateGroupLightAppear(elapsedMs, groupIndex);
  }
  return sum / LOADING_GATE_LIGHT_GROUP_COUNT;
}

/** 路地・黒幕の露出（0 = 完全な黒, 1 = ホーム bokeh 相当） */
export function getLoadingGateAlleyRevealProgress(elapsedMs: number): number {
  const lit = getLoadingGateLightLitProgress(elapsedMs);
  if (lit <= LOADING_GATE_ALLEY_REVEAL_LIT_START) return 0;

  const t = clamp01(
    (lit - LOADING_GATE_ALLEY_REVEAL_LIT_START) /
      (1 - LOADING_GATE_ALLEY_REVEAL_LIT_START),
  );
  return t ** LOADING_GATE_ALLEY_REVEAL_EASE_POWER;
}

/** @deprecated 互換 — 路地露出と同義 */
export function getLoadingGateSceneProgress(elapsedMs: number): number {
  return getLoadingGateAlleyRevealProgress(elapsedMs);
}

export function getLoadingGateBackgroundOpacity(elapsedMs: number): number {
  return (
    getLoadingGateAlleyRevealProgress(elapsedMs) * START_BOKEH_BACKGROUND_OPACITY
  );
}

export function getLoadingGateOverlayOpacity(elapsedMs: number): number {
  return 1 - getLoadingGateAlleyRevealProgress(elapsedMs);
}

export function isLoadingGateLightSequenceComplete(elapsedMs: number): boolean {
  return elapsedMs >= LOADING_GATE_LIGHT_SEQUENCE_MS;
}

export type LoadingGateOrderedLight = {
  /** 点灯順（1始まり）— 画面の赤番号と一致 */
  order: number;
  id: LoadingGateLightId;
  label: string;
  offsetX: number;
  offsetY: number;
};

const loadingGateLightCatalog = new Map<
  string,
  { label: string; offsetX: number; offsetY: number }
>();

for (const glow of [
  ...START_LAMP_GLOWS,
  ...START_BOKEH_LAMP_GLOWS,
  ...START_BOKEH_ONLY_LAMP_GLOWS,
]) {
  if (!loadingGateLightCatalog.has(glow.id)) {
    loadingGateLightCatalog.set(glow.id, {
      label: glow.label,
      offsetX: glow.offsetX,
      offsetY: glow.offsetY,
    });
  }
}

/** 点灯順どおりのメタデータ — マーカー表示用 */
export function getLoadingGateOrderedLights(): LoadingGateOrderedLight[] {
  return LOADING_GATE_LIGHT_ORDER.map((id, index) => {
    const meta = loadingGateLightCatalog.get(id);
    if (!meta) {
      throw new Error(`Loading gate light not found: ${id}`);
    }
    return {
      order: index + 1,
      id,
      label: meta.label,
      offsetX: meta.offsetX,
      offsetY: meta.offsetY,
    };
  });
}
