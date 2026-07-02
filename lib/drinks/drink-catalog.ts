/**
 * 酒カテゴリ・銘柄マスタ（β版 — 4種 + 本日の1杯）
 */

export type DrinkId = string;
export type DrinkCategoryId = string;

export type Drink = {
  id: DrinkId;
  name: string;
  displayNameJa?: string;
  note?: string;
  masterComments: string[];
};

export type DrinkCategory = {
  id: DrinkCategoryId;
  label: string;
  description: string;
  drinks: Drink[];
};

export const MASTER_DELEGATE_CATEGORY_ID = "master" as const;

/** β版で新規生成に使う4銘柄 */
export const BETA_DRINK_IDS = [
  "old-fashioned",
  "koshu",
  "bellini",
  "hot-cocoa",
] as const satisfies readonly DrinkId[];

export type BetaDrinkId = (typeof BETA_DRINK_IDS)[number];

export const DRINK_CATEGORIES: DrinkCategory[] = [
  {
    id: "heavy",
    label: "少し濃いめで",
    description: "疲れ、愚痴",
    drinks: [
      {
        id: "old-fashioned",
        name: "Old Fashioned",
        displayNameJa: "オールドファッションド",
        note: "苦味と甘みがゆっくり重なる、昔から愛されるクラシックな一杯。",
        masterComments: [
          "苦味の残る酒ほど、不思議とまた飲みたくなる。",
          "苦味まで味わうと、少し変わって見える。",
          "氷が少し溶けるたび、表情も少しずつ変わるもんだ。",
          "派手さはない。\nでも長く愛される酒には、その理由がある。",
          "最初より、最後の一口。\nそれが好きな人も多いんだ。",
          "昔からある酒は、無理に自分を飾らない。",
        ],
      },
    ],
  },
  {
    id: "clear",
    label: "整理したくて",
    description: "思考整理",
    drinks: [
      {
        id: "koshu",
        name: "甲州",
        displayNameJa: "甲州ワイン",
        note: "穏やかな香りと軽やかな飲み口。静かに考えを整理したい夜に。",
        masterComments: [
          "甲州は派手じゃない。\nでも、そういう夜にちょうどいい。",
          "飲み疲れない酒、っていうのは案外少ない。",
          "香りは控えめ。\nでもその静かさが好きな人も多い。",
          "長く付き合える一本。\n案外そういうお酒こそ目立たないもんだ。",
        ],
      },
    ],
  },
  {
    id: "glow",
    label: "余韻が残ってて",
    description: "嬉しい夜",
    drinks: [
      {
        id: "bellini",
        name: "Bellini",
        displayNameJa: "ベリーニ",
        note: "桃のやさしい甘さと泡が広がる、少しだけ華やかなカクテル。",
        masterComments: [
          "甘い一杯。\nそういう味こそ、忘れてしまうものだ。",
          "桃の甘い香りは、夜を少しだけ軽くしてくれる。",
          "今日は少しだけ、明るい色の一杯だ。",
          "乾杯にも似合うし、一人で飲んでも悪くない。\nそんな一杯だ。",
        ],
      },
    ],
  },
  {
    id: "sleepless",
    label: "眠れなくて",
    description: "眠れない、不安、落ち着きたい",
    drinks: [
      {
        id: "hot-cocoa",
        name: "ホットココア",
        displayNameJa: "ホットココア",
        note: "甘さと温もりをゆっくり味わう、お酒じゃない夜のための一杯。",
        masterComments: [
          "酔うより、温まって帰る夜も悪くない。",
          "考えすぎた日は、少し体を温めるといい。",
          "冷えた夜ほど、湯気がきれいに見えるもんだ。",
          "少しずつ冷めていく。\nその時間まで含めて、この一杯なんだ。",
        ],
      },
    ],
  },
  {
    id: MASTER_DELEGATE_CATEGORY_ID,
    label: "本日の1杯",
    description: "マスターおすすめ",
    drinks: [],
  },
];

/** heavy / clear / glow / sleepless の4銘柄（master は含まない） */
export function getBetaDrinks(): Drink[] {
  return DRINK_CATEGORIES.filter(
    (category) => category.id !== MASTER_DELEGATE_CATEGORY_ID,
  ).flatMap((category) => category.drinks);
}

export function getDrinkCategoryById(
  id: DrinkCategoryId,
): DrinkCategory | undefined {
  return DRINK_CATEGORIES.find((c) => c.id === id);
}

export function isValidDrinkCategoryId(id: string): id is DrinkCategoryId {
  return DRINK_CATEGORIES.some((c) => c.id === id);
}

export function getDrinkById(id: DrinkId): Drink | undefined {
  for (const category of DRINK_CATEGORIES) {
    const drink = category.drinks.find((d) => d.id === id);
    if (drink) return drink;
  }
  return undefined;
}

function stableSeedHash(input: string): number {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) >>> 0;
  }
  return hash;
}

export function pickDrinkMasterComment(
  drink: Pick<Drink, "id" | "masterComments">,
  seed: string,
): string {
  if (drink.masterComments.length === 0) return "";
  const index = stableSeedHash(`${drink.id}:${seed}:master-comment`) % drink.masterComments.length;
  return drink.masterComments[index] ?? "";
}
