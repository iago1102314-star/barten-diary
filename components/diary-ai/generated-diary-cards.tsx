import { NightRecordCard } from "@/components/night/night-record-card";
import type { GeneratedDiary } from "@/lib/ai/types";

type GeneratedDiaryCardsProps = {
  diary: GeneratedDiary;
};

export function GeneratedDiaryCards({ diary }: GeneratedDiaryCardsProps) {
  return <NightRecordCard record={diary} />;
}
