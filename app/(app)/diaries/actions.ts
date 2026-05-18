"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type CreateDiaryState = {
  error?: string;
};

export async function createDiary(
  _prevState: CreateDiaryState,
  formData: FormData,
): Promise<CreateDiaryState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();

  if (!title) {
    return { error: "タイトルを入力してください。" };
  }

  if (!body) {
    return { error: "本文を入力してください。" };
  }

  const { error } = await supabase.from("diaries").insert({
    user_id: user.id,
    title,
    body,
  });

  if (error) {
    console.error("Failed to create diary:", error.message);
    return { error: "日記の保存に失敗しました。もう一度お試しください。" };
  }

  revalidatePath("/diaries");
  return {};
}

export type SaveAiDiaryInput = {
  title: string;
  diary: string;
  masterComment: string;
  transcript: string;
};

export type SaveAiDiaryResult = {
  success?: boolean;
  error?: string;
};

export async function saveAiDiary(
  input: SaveAiDiaryInput,
): Promise<SaveAiDiaryResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const title = input.title.trim();
  const body = input.diary.trim();
  const masterComment = input.masterComment.trim();
  const transcript = input.transcript.trim();

  if (!title) {
    return { error: "タイトルが空です。" };
  }

  if (!body) {
    return { error: "日記本文が空です。" };
  }

  if (!masterComment) {
    return { error: "マスターの一言が空です。" };
  }

  if (!transcript) {
    return { error: "文字起こしテキストが空です。" };
  }

  const { error } = await supabase.from("diaries").insert({
    user_id: user.id,
    title,
    body,
    master_comment: masterComment,
    transcript,
  });

  if (error) {
    console.error("Failed to save AI diary:", error.message);
    return { error: "日記の保存に失敗しました。もう一度お試しください。" };
  }

  revalidatePath("/diaries");
  return { success: true };
}
