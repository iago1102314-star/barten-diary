export const MASTER_GOOD_EXAMPLES_PROMPT = `## 棚の酒メモの参考例（masterComment のみ）

入力の雰囲気: 風邪気味で、開発と学校の予定のあいだで揺れている朝。酒: 甲州ワイン（KOSHU）

{
  "masterComment": "体調と予定のあいだで少し揺れる朝に、\\nやわらかい白を置いておく。"
}

入力の雰囲気: 言葉に重さが残る夜。酒: Old Fashioned

{
  "masterComment": "言葉に重さが残る夜には、\\nゆっくり置く一杯。"
}

悪い例:
- drinkNote と masterComment の二重出力
- 「少し迷っているみたいだな。」
- 「ワインはフランス産で…」などの知識説明`;
