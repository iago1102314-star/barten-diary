import { buildBottleTag } from "@/lib/bottle-tag/build-bottle-tag";
import type { GeneratedDiary } from "@/lib/ai/types";
import { resolveDrinkById } from "@/lib/drinks/resolve-drink-from-bottle-tag";
import type { Drink } from "@/lib/drinks/drink-catalog";
import {
  pickFakeNight,
  type FakeNight,
  type FakeNightId,
} from "@/lib/dev/fake-nights";

export type SimulatedNight = {
  fake: FakeNight;
  drink: Drink;
  transcript: string;
  recordedAt: string;
  record: GeneratedDiary;
};

export function simulateNight(options?: {
  patternId?: FakeNightId;
  recordedAt?: string;
}): SimulatedNight {
  const fake = pickFakeNight(options?.patternId);
  const drink = resolveDrinkById(fake.drinkId);
  if (!drink) {
    throw new Error(`DEV fake night references unknown drink: ${fake.drinkId}`);
  }

  const recordedAt = options?.recordedAt ?? new Date().toISOString();
  const bottleTag = buildBottleTag(new Date(recordedAt), drink.name);

  return {
    fake,
    drink,
    transcript: fake.transcript,
    recordedAt,
    record: {
      bottleTag,
      diary: fake.diary,
      drinkNote: fake.drinkNote,
      masterComment: fake.masterComment,
    },
  };
}
