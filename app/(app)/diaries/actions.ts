"use server";

import { parseBottleTag } from "@/lib/bottle-tag/parse-bottle-tag";
import {
  isContinuedFromColumnMissing,
  isDrinkNoteColumnMissing,
} from "@/lib/diaries/migration-errors";
import { mergeShelfWineNote } from "@/lib/night/merge-shelf-wine-note";
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
  bottleTag: string;
  diary: string;
  drinkNote: string;
  masterComment: string;
  transcript: string;
  continuedFromDiaryId?: string | null;
  continuedFromBottleTag?: string | null;
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

  const bottleTag = input.bottleTag.trim();
  const body = input.diary.trim();
  const drinkNote = input.drinkNote.trim();
  const masterComment = input.masterComment.trim();
  const transcript = input.transcript.trim();

  if (!bottleTag) {
    return { error: "ラベルが空です。" };
  }

  if (!body) {
    return { error: "夜の記録が空です。" };
  }

  const mergedNote = mergeShelfWineNote(drinkNote, masterComment);
  const drinkName = parseBottleTag(bottleTag).drinkName;
  const masterForDb =
    mergedNote ??
    (drinkName ? `${drinkName}を、今夜の棚に。` : "今夜の棚に。");

  if (!transcript) {
    return { error: "声が届いていません。" };
  }

  const baseRow = {
    user_id: user.id,
    title: bottleTag,
    body,
    drink_note: drinkNote || null,
    master_comment: masterForDb,
    transcript,
  };

  const continuedFromDiaryId = input.continuedFromDiaryId?.trim() || null;
  const continuedFromBottleTag = input.continuedFromBottleTag?.trim() || null;

  const rowWithContinued =
    continuedFromDiaryId || continuedFromBottleTag
      ? {
          ...baseRow,
          continued_from_diary_id: continuedFromDiaryId,
          continued_from_bottle_tag: continuedFromBottleTag,
        }
      : baseRow;

  const { error } = await supabase.from("diaries").insert(rowWithContinued);

  if (error) {
    console.error("Failed to save AI diary:", error.message);

    if (isContinuedFromColumnMissing(error.message)) {
      const legacy = await supabase.from("diaries").insert(baseRow);

      if (legacy.error) {
        console.error("Failed legacy save after continued_from missing:", legacy.error.message);
        return { error: "棚へ戻せませんでした。もう一度お試しください。" };
      }

      revalidatePath("/diaries");
      revalidatePath("/memories");
      return { success: true };
    }

    if (isDrinkNoteColumnMissing(error.message)) {
      return {
        error:
          "酒の余韻用のDB設定が未完了です。Supabase の SQL Editor で supabase/migrations/004_add_drink_note.sql を実行してください。",
      };
    }

    return { error: "棚へ戻せませんでした。もう一度お試しください。" };
  }

  revalidatePath("/diaries");
  revalidatePath("/memories");
  return { success: true };
}

export type UpdateDiaryBodyState = {
  error?: string;
  success?: boolean;
};

export async function updateDiaryBody(
  _prevState: UpdateDiaryBodyState,
  formData: FormData,
): Promise<UpdateDiaryBodyState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const id = String(formData.get("id") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();

  if (!id) {
    return { error: "記録が見つかりません。" };
  }

  if (!body) {
    return { error: "言葉を残してください。" };
  }

  const { data, error } = await supabase
    .from("diaries")
    .update({ body })
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("Failed to update diary body:", error.message);

    if (
      error.message.includes("permission denied") ||
      error.message.includes("42501")
    ) {
      return {
        error:
          "更新の権限がありません。Supabase で supabase/migrations/006_diaries_update_policy.sql を実行してください。",
      };
    }

    return { error: "残せませんでした。もう一度お試しください。" };
  }

  if (!data) {
    return { error: "記録が見つかりません。" };
  }

  revalidatePath(`/diaries/${id}`);
  revalidatePath("/memories");
  revalidatePath("/diaries");
  return { success: true };
}
