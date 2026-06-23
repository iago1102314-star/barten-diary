import type { DiaryPaperData } from "@/lib/diary-paper/diary-paper-types";
import { resolveDiaryDrinkVisuals } from "@/lib/diary-paper/resolve-diary-drink-visuals";

const MOCK_VISUAL_SEED = "diary-paper-mock";
const MOCK_DRINK_NAME = "Negroni";
const mockVisuals = resolveDiaryDrinkVisuals(MOCK_VISUAL_SEED, MOCK_DRINK_NAME);

export const DIARY_PAPER_MOCK: DiaryPaperData = {
  dateLine: "2026 / 6 / 21　深夜",
  diaryVisualSeed: MOCK_VISUAL_SEED,
  drinkAlt: MOCK_DRINK_NAME,
  drinkName: MOCK_DRINK_NAME,
  body: `昨日のバイトはかなりタフだった。団体客が30人ぐらい来て、従業員は僕を含めて2人だけ。

ポンポンと客が来て、厳しい戦いになった。なんとか命からがら帰ってきたけれど、また頑張っていけたらいいなと思う。

まだ、余韻が残っている`,
  characterId: "master",
  characterComment:
    "苦味の奥に少しだけ甘さが残る。\n今日はそんな夜だったな。",
  characterSignature: "— Master",
  ...mockVisuals,
};
