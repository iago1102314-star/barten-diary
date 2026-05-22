/**
 * 酒カテゴリ・銘柄マスタ（MLP 酒ラインナップ）
 */

export type DrinkId = string;
export type DrinkCategoryId = string;

export type Drink = {
  id: DrinkId;
  name: string;
  note?: string;
};

export type DrinkCategory = {
  id: DrinkCategoryId;
  label: string;
  description: string;
  drinks: Drink[];
};

export const MASTER_DELEGATE_CATEGORY_ID = "master" as const;

export const DRINK_CATEGORIES: DrinkCategory[] = [
  {
    id: "heavy",
    label: "少し濃いめで",
    description: "重めの感情。愚痴。疲れ。人間関係。深夜。",
    drinks: [
      {
        id: "old-fashioned",
        name: "Old Fashioned",
        note: "クラシック。「静かな苦味」担当。",
      },
      {
        id: "negroni",
        name: "Negroni",
        note: "苦くて赤い。かなり夜っぽい。",
      },
      {
        id: "yamazaki-12",
        name: "山崎 12年",
        note: "日本ウイスキー枠。「ちゃんとした夜」感が強い。",
      },
    ],
  },
  {
    id: "clear",
    label: "少し整理したくて",
    description: "内省。恋愛。思考整理。開発。ぼんやり不安。",
    drinks: [
      {
        id: "koshu",
        name: "甲州ワイン（KOSHU）",
        note: "静か・繊細・日本の夜と相性がよい本命枠。",
      },
      {
        id: "gin-tonic",
        name: "Gin Tonic",
        note: "「考え事」感が強い。",
      },
      {
        id: "chablis",
        name: "Chablis（シャブリ）",
        note: "白ワイン枠。知名度と上品さのバランス。",
      },
      {
        id: "espresso",
        name: "Espresso",
        note: "酒じゃない夜を拾う。開発夜と相性が強い。",
      },
    ],
  },
  {
    id: "glow",
    label: "まだ余韻が残ってて",
    description: "嬉しさ。楽しかった日。帰り道。デート。",
    drinks: [
      {
        id: "bellini",
        name: "Bellini",
        note: "桃のスパークリング。かなりおしゃれ。",
      },
      {
        id: "moscato-dasti",
        name: "Moscato d'Asti",
        note: "軽い幸福感。名前も綺麗。",
      },
      {
        id: "kir-royale",
        name: "Kir Royale",
        note: "「余韻」感がかなり強い。",
      },
    ],
  },
  {
    id: "sleepless",
    label: "今夜は眠れそうになくて",
    description: "深夜。雨。眠れない。少し孤独。",
    drinks: [
      {
        id: "irish-coffee",
        name: "Irish Coffee",
        note: "バーテン日記と相性がよい必須級。",
      },
      {
        id: "mulled-wine",
        name: "Mulled Wine",
        note: "ホットワイン。冬イベントとも相性がよい。",
      },
      {
        id: "brandy",
        name: "Brandy",
        note: "静かな明け方感。",
      },
      {
        id: "laphroaig-10",
        name: "Laphroaig 10年",
        note: "癖強担当。「孤独」感がかなり出る。",
      },
    ],
  },
  {
    id: MASTER_DELEGATE_CATEGORY_ID,
    label: "マスターに任せる",
    description: "カテゴリ外。季節。気まぐれ。常連向け。",
    drinks: [
      {
        id: "guinness",
        name: "Guinness",
        note: "黒ビール枠。かなり夜感がある。",
      },
      {
        id: "dassai",
        name: "獺祭",
        note: "日本酒枠。かなり強い。",
      },
      {
        id: "yebisu",
        name: "YEBISU",
        note: "「ちゃんとしたビール」。",
      },
      {
        id: "talisker-10",
        name: "Talisker 10年",
        note: "雨と海感が強い。バーテン日記向き。",
      },
    ],
  },
];

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
