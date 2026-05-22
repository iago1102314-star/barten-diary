/**
 * NGワード定義 — 検出ルールとプロンプト用リストの単一ソース
 */
export type NgWordRule = {
  id: string;
  label: string;
  pattern: RegExp;
};

export const NG_WORD_RULES: NgWordRule[] = [
  { id: "meaningful", label: "有意義", pattern: /有意義/ },
  { id: "efficient", label: "効率的", pattern: /効率的/ },
  { id: "growth", label: "成長", pattern: /成長/ },
  { id: "ganbaru", label: "頑張", pattern: /頑張/ },
  { id: "learning", label: "学び", pattern: /学び/ },
  { id: "important", label: "大切", pattern: /大切/ },
  { id: "desune", label: "〜ですね", pattern: /ですね/ },
  { id: "deshou", label: "〜でしょう", pattern: /でしょう/ },
  { id: "mashou", label: "〜ましょう", pattern: /ましょう/ },
  { id: "suteki", label: "素晴らしい", pattern: /素晴らしい/ },
  { id: "seika", label: "成果", pattern: /成果/ },
  { id: "hurikaeri", label: "振り返り", pattern: /振り返り/ },
  { id: "manabi", label: "学んだ", pattern: /学んだ/ },
  { id: "seichou", label: "成長でき", pattern: /成長でき/ },
  { id: "kitto", label: "きっと大丈夫", pattern: /きっと大丈夫/ },
  { id: "souomotta", label: "そう思えた", pattern: /そう思えた/ },
  { id: "soujite", label: "総じて", pattern: /総じて/ },
  { id: "ashita", label: "明日", pattern: /明日/ },
  { id: "korekara", label: "これから", pattern: /これから/ },
  { id: "third-he", label: "三人称（彼）", pattern: /彼は|彼女は/ },
  { id: "third-bartender", label: "三人称（バーテンダーは）", pattern: /バーテンダーは/ },
];

/** プロンプト埋め込み用の短いリスト */
export const NG_WORD_LABELS_FOR_PROMPT = NG_WORD_RULES.map((r) => r.label).join(
  " / ",
);
