/**
 * マスター吹き出しの文字サイズ・間隔。
 * 見た目の調整はこのファイルの値を変える。
 */
export const MASTER_DIALOGUE_TYPOGRAPHY = {
  /** セリフ本文のフォントサイズ */
  bodyFontSize: "1.20rem",
  /** セリフ本文の行間（倍率） */
  bodyLineHeight: 1.9,
  /** セリフ本文の字間 */
  bodyLetterSpacing: "0.1em",
  /** 「マスター」ラベルのフォントサイズ */
  labelFontSize: "0.625rem",
  /** 「マスター」ラベルの字間 */
  labelLetterSpacing: "0.3em",
  /** 1文字あたりのタイプ表示間隔（ms） */
  typewriterSpeedMs: 95,
  /** 吹き出し右下の次へ促す矢印 */
  advanceCue: {
    width: 14,
    height: 12,
    /** ふわふわ上下の振幅（px） */
    floatDistance: 5,
    /** 1往復の秒数 */
    floatDuration: 2.2,
  },
} as const;
