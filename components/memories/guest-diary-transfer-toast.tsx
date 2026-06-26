"use client";

import { DiaryExportNoticePanel } from "@/components/diary-paper/diary-export-notice";
import { consumeGuestDiaryTransferPending } from "@/lib/memories/guest-diary-transfer-notice";
import { useCallback, useEffect, useState } from "react";

type GuestDiaryTransferToastProps = {
  enabled: boolean;
  loading: boolean;
};

export function GuestDiaryTransferToast({
  enabled,
  loading,
}: GuestDiaryTransferToastProps) {
  const [notice, setNotice] = useState<{ type: "success"; text: string } | null>(
    null,
  );

  useEffect(() => {
    if (!enabled || loading) return;
    if (!consumeGuestDiaryTransferPending()) return;
    setNotice({ type: "success", text: "記録を引き継ぎました。" });
  }, [enabled, loading]);

  const dismiss = useCallback(() => {
    setNotice(null);
  }, []);

  return <DiaryExportNoticePanel notice={notice} onDismiss={dismiss} />;
}
