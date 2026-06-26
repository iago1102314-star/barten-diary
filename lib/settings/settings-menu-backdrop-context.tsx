"use client";

import {
  DEFAULT_SETTINGS_MENU_BACKDROP,
  type SettingsMenuBackdrop,
} from "@/lib/settings/settings-menu-backdrop";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type SettingsMenuBackdropContextValue = {
  backdrop: SettingsMenuBackdrop;
  setBackdrop: (next: SettingsMenuBackdrop | null) => void;
};

const SettingsMenuBackdropContext =
  createContext<SettingsMenuBackdropContextValue | null>(null);

export function SettingsMenuBackdropProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [backdrop, setBackdropState] = useState<SettingsMenuBackdrop>(
    DEFAULT_SETTINGS_MENU_BACKDROP,
  );

  const setBackdrop = useCallback((next: SettingsMenuBackdrop | null) => {
    setBackdropState(next ?? DEFAULT_SETTINGS_MENU_BACKDROP);
  }, []);

  const value = useMemo(
    () => ({ backdrop, setBackdrop }),
    [backdrop, setBackdrop],
  );

  return (
    <SettingsMenuBackdropContext.Provider value={value}>
      {children}
    </SettingsMenuBackdropContext.Provider>
  );
}

export function useSettingsMenuBackdropState() {
  const context = useContext(SettingsMenuBackdropContext);
  if (!context) {
    throw new Error(
      "useSettingsMenuBackdropState must be used within SettingsMenuBackdropProvider",
    );
  }
  return context.backdrop;
}

export function useRegisterSettingsMenuBackdrop(
  descriptor: SettingsMenuBackdrop,
) {
  const context = useContext(SettingsMenuBackdropContext);
  if (!context) {
    throw new Error(
      "useRegisterSettingsMenuBackdrop must be used within SettingsMenuBackdropProvider",
    );
  }

  const { setBackdrop } = context;

  useEffect(() => {
    setBackdrop(descriptor);
    return () => setBackdrop(null);
  }, [descriptor, setBackdrop]);
}
