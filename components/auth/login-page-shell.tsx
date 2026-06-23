"use client";

import {
  clearEntranceExperienceLock,
  LOGIN_ROUTE_CLASS,
} from "@/hooks/use-entrance-scroll-lock";
import type { ReactNode } from "react";
import { useEffect } from "react";

type LoginPageShellProps = {
  children: ReactNode;
};

export function LoginPageShell({ children }: LoginPageShellProps) {
  useEffect(() => {
    clearEntranceExperienceLock();
    document.documentElement.classList.add(LOGIN_ROUTE_CLASS);
    document.body.classList.add(LOGIN_ROUTE_CLASS);

    const handlePageShow = () => {
      clearEntranceExperienceLock();
      document.documentElement.classList.add(LOGIN_ROUTE_CLASS);
      document.body.classList.add(LOGIN_ROUTE_CLASS);
    };

    window.addEventListener("pageshow", handlePageShow);
    return () => {
      window.removeEventListener("pageshow", handlePageShow);
      document.documentElement.classList.remove(LOGIN_ROUTE_CLASS);
      document.body.classList.remove(LOGIN_ROUTE_CLASS);
    };
  }, []);

  return (
    <div className="login-route-shell relative z-[100] flex flex-1 flex-col items-center justify-center px-6 py-16">
      {children}
    </div>
  );
}
