import {
  FEEDBACK_BODY_MAX,
  FEEDBACK_PAGE_PATH_MAX,
  FEEDBACK_PLATFORMS,
  FEEDBACK_TYPES,
  FEEDBACK_USER_AGENT_MAX,
  type FeedbackPlatform,
  type FeedbackType,
  type SubmitFeedbackInput,
} from "@/lib/feedback/types";

export function isFeedbackPlatform(value: string): value is FeedbackPlatform {
  return (FEEDBACK_PLATFORMS as readonly string[]).includes(value);
}

export function isFeedbackType(value: string): value is FeedbackType {
  return (FEEDBACK_TYPES as readonly string[]).includes(value);
}

export function validateFeedbackInput(
  input: Pick<SubmitFeedbackInput, "type" | "rating" | "body">,
): string | null {
  if (!isFeedbackType(input.type)) {
    return "カテゴリーを選択してください。";
  }

  const body = input.body.trim();
  if (body.length < 1) {
    return "内容を入力してください。";
  }
  if (body.length > FEEDBACK_BODY_MAX) {
    return "2000文字以内で入力してください。";
  }

  if (input.type === "review") {
    if (
      input.rating == null ||
      !Number.isInteger(input.rating) ||
      input.rating < 1 ||
      input.rating > 5
    ) {
      return "評価を選択してください。";
    }
  } else if (input.rating != null) {
    return "評価はレビューのみ選択できます。";
  }

  return null;
}

export function validateFeedbackMeta(
  pagePath: string,
  userAgent: string,
  platform: string,
): string | null {
  if (!isFeedbackPlatform(platform)) {
    return "送信できませんでした。時間をおいてもう一度お試しください。";
  }
  if (pagePath.length > FEEDBACK_PAGE_PATH_MAX) {
    return "送信できませんでした。時間をおいてもう一度お試しください。";
  }
  if (userAgent.length > FEEDBACK_USER_AGENT_MAX) {
    return "送信できませんでした。時間をおいてもう一度お試しください。";
  }
  return null;
}
