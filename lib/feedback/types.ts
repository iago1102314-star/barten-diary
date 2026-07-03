export const FEEDBACK_TYPES = ["review", "bug", "suggestion"] as const;

export type FeedbackType = (typeof FEEDBACK_TYPES)[number];

export const FEEDBACK_BODY_MAX = 2000;

export const FEEDBACK_PAGE_PATH_MAX = 500;

export const FEEDBACK_USER_AGENT_MAX = 1000;

export const FEEDBACK_PLATFORMS = ["PWA", "Browser"] as const;

export type FeedbackPlatform = (typeof FEEDBACK_PLATFORMS)[number];

export const FEEDBACK_CATEGORY_LABELS: Record<FeedbackType, string> = {
  review: "レビュー",
  bug: "バグ報告",
  suggestion: "提案",
};

export const FEEDBACK_PLACEHOLDERS: Record<FeedbackType, string> = {
  review: "感想をお聞かせください",
  bug: "バグの内容や、起きた場面を教えてください",
  suggestion: "あったら嬉しい機能や改善案をお聞かせください",
};

export type SubmitFeedbackInput = {
  type: FeedbackType;
  rating: number | null;
  body: string;
  pagePath: string;
  userAgent: string;
  platform: FeedbackPlatform;
  isAdmin?: boolean;
};

export type SubmitFeedbackResult = {
  success?: boolean;
  error?: string;
  errorCode?: string | null;
  errorDetails?: string | null;
};
