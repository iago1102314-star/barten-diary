import type { GeneratedDiary } from "@/lib/ai/types";

export type ReviewRating = "good" | "bad";

export type LabReviewNote = {
  id: string;
  variantLabel: string;
  temperature: number;
  rating: ReviewRating | null;
  goodReason: string;
  badReason: string;
  transcript: string;
  output: GeneratedDiary;
  adjustments: string[];
  updatedAt: string;
};
