"use client";

import {
  buildAuthCallbackUrl,
  readOAuthRedirectTo,
} from "@/lib/auth/auth-callback-url";
import { readSupabaseProjectRef } from "@/lib/auth/supabase-project-ref";
import { createClient } from "@/lib/supabase/client";
import { isLocal } from "@/lib/env/app-env";
import { useCallback, useEffect, useState } from "react";

type DiagnosticState =
  | { status: "idle" }
  | { status: "loading" }
  | {
      status: "done";
      origin: string;
      callbackUrl: string;
      projectRef: string | null;
      oauthRedirectTo: string | null;
      secureContext: boolean;
      webCrypto: boolean;
    }
  | { status: "error"; message: string };

export function LoginAuthDiagnostics() {
  const [state, setState] = useState<DiagnosticState>({ status: "idle" });

  const runDiagnostics = useCallback(async () => {
    setState({ status: "loading" });

    try {
      const origin = window.location.origin;
      const callbackUrl = buildAuthCallbackUrl(origin);
      const projectRef = readSupabaseProjectRef(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
      );

      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: callbackUrl,
          skipBrowserRedirect: true,
        },
      });

      if (error) {
        throw error;
      }

      setState({
        status: "done",
        origin,
        callbackUrl,
        projectRef,
        oauthRedirectTo: data.url ? readOAuthRedirectTo(data.url) : null,
        secureContext: window.isSecureContext,
        webCrypto: Boolean(window.crypto?.subtle),
      });
    } catch (error) {
      setState({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "診断に失敗しました",
      });
    }
  }, []);

  useEffect(() => {
    if (!isLocal) return;
    void runDiagnostics();
  }, [runDiagnostics]);

  if (!isLocal) return null;

  if (state.status === "idle" || state.status === "loading") {
    return (
      <p className="text-left text-[10px] leading-relaxed tracking-[0.04em] text-stone-600">
        ログイン診断を準備しています…
      </p>
    );
  }

  if (state.status === "error") {
    return (
      <div className="space-y-2 text-left text-[10px] leading-relaxed tracking-[0.04em] text-red-300/80">
        <p>ログイン診断に失敗しました。</p>
        <p className="whitespace-pre-wrap">{state.message}</p>
        <button
          type="button"
          onClick={() => void runDiagnostics()}
          className="text-stone-500 underline"
        >
          再診断
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2 text-left text-[10px] leading-relaxed tracking-[0.04em] text-stone-600">
      <p className="text-stone-500">開発用ログイン診断</p>
      <p>
        今開いている URL:
        <br />
        <span className="text-stone-400">{state.origin}</span>
      </p>
      <p>
        Supabase に登録が必要な callback（コピペ用）:
        <br />
        <span className="text-stone-400">{state.callbackUrl}</span>
      </p>
      {state.projectRef ? (
        <p>
          接続中の Supabase プロジェクト:
          <br />
          <span className="text-stone-400">{state.projectRef}</span>
        </p>
      ) : null}
      <p>
        OAuth 開始時の redirect_to:
        <br />
        <span className="text-stone-400">
          {state.oauthRedirectTo ?? "（取得できませんでした）"}
        </span>
      </p>
      <p className="text-stone-500">
        上の redirect_to が一致していても、Supabase の Redirect URLs
        に callback が無いと Google ログイン後に本番ドメインへ飛びます。ダッシュボードで
        <strong className="font-normal text-stone-400">
          {" "}
          同じプロジェクト（{state.projectRef ?? "?"})
        </strong>
        を開いているか確認してください。
      </p>
      {!state.secureContext ? (
        <p className="text-stone-500">
          HTTP LAN ですが、「入店する」はサーバー側で PKCE を生成するため、WebCrypto
          警告はログイン本体には影響しません。
        </p>
      ) : null}
      <button
        type="button"
        onClick={() => void runDiagnostics()}
        className="text-stone-500 underline"
      >
        再診断
      </button>
    </div>
  );
}
