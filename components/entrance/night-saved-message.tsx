"use client";

import { MasterLine } from "@/components/entrance/master-line";

type NightSavedMessageProps = {
  error?: string | null;
};

export function NightSavedMessage({ error }: NightSavedMessageProps) {
  return (
    <div className="space-y-4 text-center">
      {error ? (
        <>
          <p className="text-[14px] tracking-wide text-stone-300/88">
            記録は紡げましたが、棚へ戻せませんでした。
          </p>
          <p className="text-[11px] leading-relaxed text-stone-500/80">{error}</p>
        </>
      ) : (
        <p className="text-[14px] tracking-wide text-stone-200/88">
          今夜の記録を残しました。
        </p>
      )}
    </div>
  );
}

type NightFarewellProps = {
  children?: string;
};

export function NightFarewell({
  children = "……気をつけて帰れよ",
}: NightFarewellProps) {
  return <MasterLine>{children}</MasterLine>;
}
