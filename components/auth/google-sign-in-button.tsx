"use client";

import {
  signInWithGoogleAction,
  type SignInWithGoogleState,
} from "@/app/login/actions";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

const initialState: SignInWithGoogleState = { error: null };

export function GoogleSignInButton() {
  const [state, formAction] = useActionState(
    signInWithGoogleAction,
    initialState,
  );

  return (
    <div className="relative z-[110] space-y-3">
      <form action={formAction}>
        <SignInSubmitButton />
      </form>
      {state.error ? (
        <p
          role="alert"
          className="whitespace-pre-wrap text-left text-sm leading-relaxed text-red-300/80"
        >
          {state.error}
        </p>
      ) : null}
    </div>
  );
}

function SignInSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="relative z-[110] mx-auto flex h-11 min-h-[44px] w-full max-w-xs touch-manipulation cursor-pointer items-center justify-center gap-3 rounded-full border border-stone-700/50 bg-stone-900/60 px-8 text-sm text-stone-400 transition-colors hover:border-stone-600 hover:text-stone-300 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <GoogleIcon />
      {pending ? "…" : "入店する"}
    </button>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.74-.06-1.28-.19-1.84H9v3.34h4.84a4.14 4.14 0 0 1-1.42 2.72v2.26h2.3c1.34-1.24 2.12-3.06 2.12-5.38z"
      />
      <path
        fill="#34A853"
        d="M9 18c1.94 0 3.57-.64 4.76-1.74l-2.3-2.26c-.64.43-1.46.68-2.46.68-1.89 0-3.49-1.28-4.06-3.01H2.54v2.33A8.01 8.01 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M4.94 10.67a4.8 4.8 0 0 1 0-3.34V5H2.54a8.01 8.01 0 0 0 0 7.34l2.4-2.67z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.06 0 2.01.36 2.76 1.07l2.07-2.07A7.94 7.94 0 0 0 9 2a8.01 8.01 0 0 0-7.46 4.67l2.4 2.33C4.51 4.86 6.11 3.58 9 3.58z"
      />
    </svg>
  );
}
