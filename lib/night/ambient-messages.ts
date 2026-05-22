import type { TranscriptValidationCode } from "@/lib/ai/security/validate-input";

export type AmbientMessageKind =
  | "too_short"
  | "unintelligible"
  | "silent"
  | "generic";

export type AmbientMessage = {
  kind: AmbientMessageKind;
  lines: string[];
};

const TOO_SHORT: AmbientMessage = {
  kind: "too_short",
  lines: [
    "……まだ少ししか聞けてない。",
    "もう一度だけ、聞かせてくれ。",
  ],
};

const UNINTELLIGIBLE: AmbientMessage = {
  kind: "unintelligible",
  lines: ["……少し途切れてしまったな。"],
};

const SILENT: AmbientMessage = {
  kind: "silent",
  lines: ["……まだ、何も預かってない。"],
};

const GENERIC: AmbientMessage = {
  kind: "generic",
  lines: [
    "……悪い、少し聞き取れなかった。",
    "もう少しだけ聞かせてくれるか。",
  ],
};

export function ambientMessageFromValidationCode(
  code: TranscriptValidationCode,
): AmbientMessage {
  if (code === "empty") return SILENT;
  if (code === "too_short" || code === "filler_only") return TOO_SHORT;
  if (
    code === "symbols_only" ||
    code === "repetition_only" ||
    code === "same_char_run"
  ) {
    return UNINTELLIGIBLE;
  }
  return GENERIC;
}

export function ambientMessageFromTranscriptError(
  message?: string | null,
): AmbientMessage {
  if (!message) return GENERIC;

  if (
    message.includes("短") ||
    message.includes("聞かせて") ||
    message.includes("足りない")
  ) {
    return TOO_SHORT;
  }

  if (
    message.includes("拾え") ||
    message.includes("届きません") ||
    message.includes("空") ||
    message.includes("聴き取れ")
  ) {
    return GENERIC;
  }

  return UNINTELLIGIBLE;
}

export function ambientMessageFromUnknownFailure(): AmbientMessage {
  return GENERIC;
}
