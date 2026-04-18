"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const ITEM_COMPARE_KEY = "vaultborne_item_compare";

type Ctx = {
  itemCompareEnabled: boolean;
  setItemCompareEnabled: (v: boolean) => void;
};

const UiPrefsContext = createContext<Ctx | null>(null);

export function UiPrefsProvider({ children }: { children: React.ReactNode }) {
  const [itemCompareEnabled, setItemCompareState] = useState(false);

  useEffect(() => {
    const v = window.localStorage.getItem(ITEM_COMPARE_KEY);
    setItemCompareState(v === "1" || v === "true");
  }, []);

  const setItemCompareEnabled = useCallback((v: boolean) => {
    setItemCompareState(v);
    window.localStorage.setItem(ITEM_COMPARE_KEY, v ? "1" : "0");
  }, []);

  const value = useMemo(
    () => ({ itemCompareEnabled, setItemCompareEnabled }),
    [itemCompareEnabled, setItemCompareEnabled],
  );

  return <UiPrefsContext.Provider value={value}>{children}</UiPrefsContext.Provider>;
}

export function useUiPrefs() {
  const c = useContext(UiPrefsContext);
  if (!c) throw new Error("useUiPrefs must be used within UiPrefsProvider");
  return c;
}
