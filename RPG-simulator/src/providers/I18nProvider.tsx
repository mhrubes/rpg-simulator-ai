"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { AppLocale } from "@/i18n/messages";
import { MESSAGES } from "@/i18n/messages";

const LOCALE_KEY = "vaultborne_locale";

type Ctx = {
  locale: AppLocale;
  setLocale: (l: AppLocale) => void;
  t: (key: string) => string;
};

const I18nContext = createContext<Ctx | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLoc] = useState<AppLocale>("cs");

  useEffect(() => {
    const v = window.localStorage.getItem(LOCALE_KEY);
    if (v === "en" || v === "cs") setLoc(v);
  }, []);

  const setLocale = useCallback((l: AppLocale) => {
    setLoc(l);
    window.localStorage.setItem(LOCALE_KEY, l);
  }, []);

  const t = useMemo(() => {
    const table = MESSAGES[locale];
    return (key: string) => table[key] ?? MESSAGES.cs[key] ?? key;
  }, [locale]);

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const c = useContext(I18nContext);
  if (!c) throw new Error("useI18n");
  return c;
}
