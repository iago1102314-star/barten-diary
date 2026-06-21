import { verifyGenerationReadiness } from "@/lib/ai/generation-readiness-server";
import { NextResponse } from "next/server";

/** GET — OpenAI 到達性のみ（本文生成なし・数秒以内） */
export async function GET() {
  const result = await verifyGenerationReadiness();

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: result.status ?? 503 });
  }

  return NextResponse.json({ ok: true });
}
