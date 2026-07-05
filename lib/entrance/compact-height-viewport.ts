import { MOOD_SELECT_LAYOUT_TUNING } from "@/lib/entrance/mood-select-layout-tuning";
import { PAST_BOTTLE_LINK_TUNING } from "@/lib/entrance/past-bottle-link-tuning";

/** この高さ以下だけ compact height プロファイル（SE3 Safari 等） */
export const COMPACT_HEIGHT_VIEWPORT_MAX_PX = 699;

/**
 * 感情選択 — compact height のみ上書き。
 * 通常値は MOOD_SELECT_LAYOUT_TUNING をそのまま使う。
 */
export const COMPACT_MOOD_SELECT_LAYOUT_OVERRIDES = {
  optionBlockBottomPx: 100,
  footerBottomPx: 32,
  /** 感情ボタン列の縦 gap（通常は 12 = gap-3） */
  optionStackGapPx: 8,
} as const;

/**
 * 過去のボトルから — compact height のみ上書き。
 * 通常値は PAST_BOTTLE_LINK_TUNING をそのまま使う。
 */
export const COMPACT_PAST_BOTTLE_LINK_OVERRIDES = {
  headerTopPercent: 7.5,
  icon: {
    displayScale: 0.8,
  },
  divider: {
    offsetYpx: -6,
  },
} as const;

export type ResolvedMoodSelectLayoutTuning = {
  optionBlockBottomPx: number;
  footerBottomPx: number;
  horizontalPaddingPx: number;
  optionStackGapPx: number;
};

export type ResolvedPastBottleLinkTuning = ReturnType<
  typeof resolvePastBottleLinkTuning
>;

const DEFAULT_OPTION_STACK_GAP_PX = 12;

/** 実効ビューポート高さ（px）— visualViewport 優先 */
export function readViewportHeightPx(): number {
  if (typeof window === "undefined") return COMPACT_HEIGHT_VIEWPORT_MAX_PX + 1;
  const visual = window.visualViewport?.height;
  if (visual != null && visual > 0) return Math.round(visual);
  return Math.round(window.innerHeight);
}

/** 高さ 699px 以下 — compact height プロファイルを使う */
export function isCompactHeightViewport(
  heightPx = readViewportHeightPx(),
): boolean {
  return heightPx <= COMPACT_HEIGHT_VIEWPORT_MAX_PX;
}

export function resolveMoodSelectLayoutTuning(
  compact: boolean,
): ResolvedMoodSelectLayoutTuning {
  if (!compact) {
    return {
      ...MOOD_SELECT_LAYOUT_TUNING,
      optionStackGapPx: DEFAULT_OPTION_STACK_GAP_PX,
    };
  }

  return {
    ...MOOD_SELECT_LAYOUT_TUNING,
    ...COMPACT_MOOD_SELECT_LAYOUT_OVERRIDES,
  };
}

export function resolvePastBottleLinkTuning(compact: boolean) {
  if (!compact) return PAST_BOTTLE_LINK_TUNING;

  const { icon, divider, ...rest } = COMPACT_PAST_BOTTLE_LINK_OVERRIDES;

  return {
    ...PAST_BOTTLE_LINK_TUNING,
    ...rest,
    icon: {
      ...PAST_BOTTLE_LINK_TUNING.icon,
      ...icon,
    },
    divider: {
      ...PAST_BOTTLE_LINK_TUNING.divider,
      ...divider,
    },
  };
}
