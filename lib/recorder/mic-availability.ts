/** マイクが使えない理由（getUserMedia 呼び出し前の判定） */
export type MicBlockReason = "insecure_context" | "unsupported";

export type MicAvailability = {
  available: boolean;
  reason?: MicBlockReason;
  /** 診断ログ用 */
  detail?: string;
};

export function getMicAvailability(): MicAvailability {
  if (typeof window === "undefined") {
    return { available: false, reason: "unsupported", detail: "SSR" };
  }

  const getUserMedia = navigator.mediaDevices?.getUserMedia;
  if (typeof getUserMedia === "function") {
    return { available: true };
  }

  if (!window.isSecureContext) {
    return {
      available: false,
      reason: "insecure_context",
      detail: `isSecureContext=false hostname=${window.location.hostname}`,
    };
  }

  return {
    available: false,
    reason: "unsupported",
    detail: "mediaDevices.getUserMedia missing",
  };
}

/** listen failure の reason 文字列からブロック種別を推定 */
export function micBlockReasonFromPipelineError(
  reason: string | null | undefined,
): MicBlockReason | null {
  if (!reason) return null;
  if (
    reason.includes("HTTPS or localhost") ||
    reason.includes("isSecureContext") ||
    reason.includes("insecure")
  ) {
    return "insecure_context";
  }
  if (reason.includes("getUserMedia") || reason.includes("NotAllowedError")) {
    return reason.includes("NotAllowedError") ? null : "unsupported";
  }
  return null;
}

/** マスター吹き出し用 — 聞き取りづらかった（録音失敗）ではない */
export function micBlockedMasterLines(reason: MicBlockReason): string[] {
  if (reason === "insecure_context") {
    return [
      "……すまない。",
      "この開き方ではマイクが使えない。",
      "https で開き直してくれ。",
    ];
  }

  return [
    "……すまない。",
    "この端末では録音が使えない。",
  ];
}

/** 口をつける前の注意（UI バナー用） */
export function micBlockedHintText(reason: MicBlockReason): string {
  if (reason === "insecure_context") {
    return [
      "iPhone では http://192.168.x.x ではマイク許可が出ません。",
      "① ターミナル1: npm run dev:lan",
      "② ターミナル2: npm run dev:tunnel → 表示された https://….trycloudflare.com を iPhone Safari で開く",
      "（または Vercel dev の https URL）",
    ].join("\n");
  }
  return "このブラウザではマイクが使えません。";
}
