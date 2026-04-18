"use client";

import { useI18n } from "@/providers/I18nProvider";
import { useUiPrefs } from "@/providers/UiPrefsProvider";
import type { AppLocale } from "@/i18n/messages";

export default function SettingsPage() {
  const { t, locale, setLocale } = useI18n();
  const { itemCompareEnabled, setItemCompareEnabled } = useUiPrefs();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-white">{t("settings.title")}</h1>
      </header>
      <div className="vb-card max-w-md space-y-3 p-5">
        <p className="text-base text-vb-muted">{t("settings.locale")}</p>
        <div className="flex gap-2">
          {(["cs", "en"] as AppLocale[]).map((l) => (
            <button
              key={l}
              type="button"
              className={`vb-btn flex-1 ${locale === l ? "vb-btn-primary" : ""}`}
              onClick={() => setLocale(l)}
            >
              {l === "cs" ? t("settings.locale.cs") : t("settings.locale.en")}
            </button>
          ))}
        </div>
      </div>

      <div className="vb-card max-w-lg space-y-3 p-5">
        <p className="text-base font-medium text-white">{t("settings.itemCompare")}</p>
        <p className="text-sm leading-relaxed text-vb-muted">{t("settings.itemCompareHint")}</p>
        <div className="flex gap-2">
          <button
            type="button"
            className={`vb-btn flex-1 ${itemCompareEnabled ? "vb-btn-primary" : ""}`}
            onClick={() => setItemCompareEnabled(true)}
          >
            {t("settings.itemCompareOn")}
          </button>
          <button
            type="button"
            className={`vb-btn flex-1 ${!itemCompareEnabled ? "vb-btn-primary" : ""}`}
            onClick={() => setItemCompareEnabled(false)}
          >
            {t("settings.itemCompareOff")}
          </button>
        </div>
      </div>
    </div>
  );
}
