export type BehaviorEventMetadataInput = {
  categoryId?: string | null;
  drinkId?: string | null;
  diaryId?: string | null;
  duration?: number | null;
  error?: string | null;
  retry?: boolean;
};

/** event_logs metadata — キー順・欠損フィールド省略を統一 */
export function buildBehaviorEventMetadata(
  input: BehaviorEventMetadataInput,
): Record<string, unknown> {
  const metadata: Record<string, unknown> = {};

  if (input.categoryId != null && input.categoryId !== "") {
    metadata.categoryId = input.categoryId;
  }
  if (input.drinkId != null && input.drinkId !== "") {
    metadata.drinkId = input.drinkId;
  }
  if (input.diaryId != null && input.diaryId !== "") {
    metadata.diaryId = input.diaryId;
  }
  if (input.duration != null && Number.isFinite(input.duration)) {
    metadata.duration = Math.round(input.duration);
  }
  if (input.error != null && input.error !== "") {
    metadata.error = input.error;
  }
  if (input.retry === true) {
    metadata.retry = true;
  }

  return metadata;
}
