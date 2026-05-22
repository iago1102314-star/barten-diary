"use client";

import {
  updateDiaryBody,
  type UpdateDiaryBodyState,
} from "@/app/(app)/diaries/actions";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";

type EditMemoFormProps = {
  diaryId: string;
  initialBody: string;
  onCancel: () => void;
  onSaved: () => void;
};

const initialState: UpdateDiaryBodyState = {};

export function EditMemoForm({
  diaryId,
  initialBody,
  onCancel,
  onSaved,
}: EditMemoFormProps) {
  const router = useRouter();
  const [state, formAction] = useActionState(updateDiaryBody, initialState);

  useEffect(() => {
    if (!state.success) return;
    router.refresh();
    onSaved();
  }, [state.success, router, onSaved]);

  return (
    <div className="space-y-8">
      <header className="space-y-2 text-center">
        <p className="text-[11px] tracking-[0.2em] text-stone-600">言葉を整える</p>
        <p className="text-[12px] leading-relaxed text-stone-600/90">
          名前や聞き間違いがあれば、少しだけ直せます。
        </p>
      </header>

      <form action={formAction} className="space-y-8">
        <input type="hidden" name="id" value={diaryId} />

        <div className="night-glow rounded-xl border border-stone-800/40 bg-stone-950/35 px-5 py-8 sm:px-6 sm:py-9">
          <textarea
            name="body"
            defaultValue={initialBody}
            required
            rows={14}
            className="block w-full resize-y border-0 bg-transparent text-[14px] leading-[2] tracking-[0.02em] text-stone-300/85 outline-none placeholder:text-stone-700 focus:ring-0"
          />
        </div>

        {state.error && (
          <p
            role="alert"
            className="text-center text-[11px] leading-relaxed text-red-300/75"
          >
            {state.error}
          </p>
        )}

        <div className="flex flex-col items-center gap-5">
          <SaveButton />
          <button
            type="button"
            onClick={onCancel}
            className="text-[11px] tracking-[0.2em] text-stone-600 transition-colors hover:text-stone-400"
          >
            戻る
          </button>
        </div>
      </form>
    </div>
  );
}

function SaveButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="text-[11px] tracking-[0.22em] text-stone-400 transition-colors hover:text-stone-200 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "残しています…" : "この形で残す"}
    </button>
  );
}
