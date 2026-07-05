/**
 * 気分選択画面 — ボタン列・フッターの縦位置。
 *
 * 感情選択ボタン（少し濃いめで等）は optionBlockBottomPx だけで決まる。
 * フッター（線・また今度にする）の変更では動かない。
 *
 * 高さ 699px 以下 — compact-height-viewport.ts の COMPACT_MOOD_SELECT_LAYOUT_OVERRIDES
 */
export const MOOD_SELECT_LAYOUT_TUNING = {
  /** 画面下端から感情選択ボタン列の下端まで（px） */
  optionBlockBottomPx: 122,
  /** 画面下端からフッターの下端まで（px）— 旧 pb-10 相当 */
  footerBottomPx: 40,
  /** 横 padding（px-7 = 28px） */
  horizontalPaddingPx: 28,
} as const;
