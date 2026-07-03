"use server";

import { APP_VERSION } from "@/lib/app-version";
import {
  validateFeedbackInput,
  validateFeedbackMeta,
} from "@/lib/feedback/validate-feedback";
import type {
  FeedbackPlatform,
  FeedbackType,
  SubmitFeedbackInput,
  SubmitFeedbackResult,
} from "@/lib/feedback/types";
import { createClient } from "@/lib/supabase/server";

type FeedbackInsertRow = {
  user_id: string | null;
  type: FeedbackType;
  rating: number | null;
  body: string;
  page_path: string;
  user_agent: string;
  app_version: string;
  platform: FeedbackPlatform;
};

function buildFeedbackInsertRow(
  input: SubmitFeedbackInput,
  userId: string | null,
  body: string,
  pagePath: string,
  userAgent: string,
): FeedbackInsertRow {
  const rating: number | null =
    input.type === "review" ? input.rating : null;

  return {
    user_id: userId,
    type: input.type,
    rating,
    body,
    page_path: pagePath,
    user_agent: userAgent,
    app_version: APP_VERSION,
    platform: input.platform,
  };
}

function formatSupabaseErrorDetails(details: unknown): string | null {
  if (details == null) return null;
  if (typeof details === "string") return details;
  try {
    return JSON.stringify(details);
  } catch {
    return String(details);
  }
}

export async function submitFeedback(
  input: SubmitFeedbackInput,
): Promise<SubmitFeedbackResult> {
  const validationError = validateFeedbackInput(input);
  if (validationError) {
    return { error: validationError };
  }

  const pagePath = input.pagePath.trim();
  const userAgent = input.userAgent.trim();
  const metaError = validateFeedbackMeta(pagePath, userAgent, input.platform);
  if (metaError) {
    return { error: metaError };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const body = input.body.trim();
  const row = buildFeedbackInsertRow(
    input,
    user?.id ?? null,
    body,
    pagePath,
    userAgent,
  );

  const { error } = await supabase.from("feedbacks").insert(row);

  if (error) {
    const errorDetails = formatSupabaseErrorDetails(error.details);
    console.error("Failed to submit feedback (public.feedbacks):", {
      message: error.message,
      code: error.code,
      details: errorDetails,
      hint: error.hint,
      payload: row,
    });
    return {
      error: error.message,
      errorCode: error.code ?? null,
      errorDetails,
    };
  }

  return { success: true };
}
