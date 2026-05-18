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
