"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type SettingsMenuHideReason =
  | "loading-gate"
  | "entrance-scene"
  | "diary-detail";

type SettingsMenuVisibilityContextValue = {
  visible: boolean;
  setHidden: (reason: SettingsMenuHideReason, hidden: boolean) => void;
};

const SettingsMenuVisibilityContext =
  createContext<SettingsMenuVisibilityContextValue | null>(null);

export function SettingsMenuVisibilityProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [hiddenReasons, setHiddenReasons] = useState<
    Set<SettingsMenuHideReason>
  >(() => new Set());

  const setHidden = useCallback(
    (reason: SettingsMenuHideReason, hidden: boolean) => {
      setHiddenReasons((prev) => {
        const next = new Set(prev);
        if (hidden) {
          next.add(reason);
        } else {
          next.delete(reason);
        }
        return next;
      });
    },
    [],
  );

  const value = useMemo(
    () => ({
      visible: hiddenReasons.size === 0,
      setHidden,
    }),
    [hiddenReasons, setHidden],
  );

  return (
    <SettingsMenuVisibilityContext.Provider value={value}>
      {children}
    </SettingsMenuVisibilityContext.Provider>
  );
}

export function useSettingsMenuVisibility() {
  const context = useContext(SettingsMenuVisibilityContext);
  if (!context) {
    throw new Error(
      "useSettingsMenuVisibility must be used within SettingsMenuVisibilityProvider",
    );
  }
  return context;
}

export function useSettingsMenuHidden(
  reason: SettingsMenuHideReason,
  hidden: boolean,
) {
  const { setHidden } = useSettingsMenuVisibility();

  useEffect(() => {
    setHidden(reason, hidden);
    return () => setHidden(reason, false);
  }, [hidden, reason, setHidden]);
}
