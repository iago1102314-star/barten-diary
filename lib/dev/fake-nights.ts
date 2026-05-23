import type { DrinkCategoryId, DrinkId } from "@/lib/drinks/drink-catalog";

export type FakeNightId = "dev" | "lonely" | "romance";

export type FakeNight = {
  id: FakeNightId;
  categoryId: DrinkCategoryId;
  drinkId: DrinkId;
  transcript: string;
  diary: string;
  drinkNote: string;
  masterComment: string;
};

export const DEV_FAKE_NIGHTS: Record<FakeNightId, FakeNight> = {
  dev: {
    id: "dev",
    categoryId: "clear",
    drinkId: "espresso",
    transcript:
      "今日は開発の続きをしていた。機能のつなぎがまだ気になるけど、少しは前に進んだ気がする。",
    diary:
      "カウンターに置かれたエスプレッソは、まだ湯気を残していた。\n\n画面の向こうで動かしていたものの輪郭が、少しだけはっきり見えた夜。完璧ではない。でも、手を動かしていた時間は確かにあった。",
    drinkNote: "Espresso — 開発夜の定番。苦味で思考を整える。",
    masterComment: "……進んでいるなら、それでいい。",
  },
  lonely: {
    id: "lonely",
    categoryId: "heavy",
    drinkId: "old-fashioned",
    transcript:
      "誰にも連絡しなかった一日だった。特別悲しいわけじゃない。ただ、静かすぎた。",
    diary:
      "氷が溶ける音だけが、カウンターの上で続いていた。\n\n誰かの返事を待っていたわけでもない。それでも、少しだけ声が欲しかった夜。",
    drinkNote: "Old Fashioned — 静かな苦味。言葉の代わり。",
    masterComment: "……そういう夜も、ある。",
  },
  romance: {
    id: "romance",
    categoryId: "glow",
    drinkId: "bellini",
    transcript:
      "帰り道、街の灯りがいつもよりきれいに見えた。理由ははっきりしない。ただ、少し嬉しかった。",
    diary:
      "グラスの縁に残った泡が、ゆっくりと消えていく。\n\n名前のない余韻を、胸の奥にしまい込んだ夜。説明できないけれど、確かにあった。",
    drinkNote: "Bellini — 桃の甘さと、帰り道の灯り。",
    masterComment: "……いい夜だったな。",
  },
};

export function pickFakeNight(id?: FakeNightId): FakeNight {
  if (id) return DEV_FAKE_NIGHTS[id];
  const ids = Object.keys(DEV_FAKE_NIGHTS) as FakeNightId[];
  return DEV_FAKE_NIGHTS[ids[Math.floor(Math.random() * ids.length)]];
}
