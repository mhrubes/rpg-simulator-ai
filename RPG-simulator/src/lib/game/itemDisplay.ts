import type { AppLocale } from "@/i18n/messages";
import { primaryStatForClass } from "./formulas";
import type { GameItem, PlayerClass, StatKey } from "./types";

const STAT_ORDER: StatKey[] = ["str", "dex", "int", "vit"];

export const STAT_SHORT_LABELS: Record<AppLocale, Record<StatKey, string>> = {
  cs: { str: "Síl", dex: "Obr", int: "Int", vit: "Živ" },
  en: { str: "Str", dex: "Dex", int: "Int", vit: "Vit" },
};

export function statShortLabel(locale: AppLocale, k: StatKey): string {
  return STAT_SHORT_LABELS[locale][k];
}

const ATK_LABEL: Record<AppLocale, string> = {
  cs: "Útok",
  en: "Atk",
};

/**
 * Odhad útoku zbraně: podle třídy postavy se počítá jen z primárního atributu
 * (rytíř → síla, lukostřelec → obratnost, kouzelník → inteligence).
 */
export function estimatedWeaponPower(item: GameItem, playerClass: PlayerClass): number | null {
  if (item.kind !== "weapon") return null;
  const primary = primaryStatForClass(playerClass);
  const v = item.stats[primary] ?? 0;
  return Math.round(8 + v * 1.55);
}

export function itemStatBonusLines(item: GameItem, locale: AppLocale): string[] {
  const lab = STAT_SHORT_LABELS[locale];
  const out: string[] = [];
  for (const k of STAT_ORDER) {
    const v = item.stats[k];
    if (v != null && v > 0) out.push(`+${v} ${lab[k]}`);
  }
  return out;
}

export type ItemDetailLines = {
  /** řádky bonusů (+Síl …) */
  bonuses: string[];
  /** pro zbraň: „Útok ~42“ */
  powerLine: string | null;
  /** elixír: krátký popis */
  elixirHint: string | null;
};

export function getItemDetailLines(item: GameItem, locale: AppLocale, playerClass: PlayerClass): ItemDetailLines {
  const bonuses = itemStatBonusLines(item, locale);
  const atk = estimatedWeaponPower(item, playerClass);
  const powerLine = atk != null ? `${atkLabel(locale)} ~${atk}` : null;

  let elixirHint: string | null = null;
  if (item.kind === "elixir" && item.elixirStat) {
    const L = STAT_SHORT_LABELS[locale][item.elixirStat];
    elixirHint = locale === "cs" ? `Elixír · ${L}` : `Elixir · ${L}`;
  }

  return { bonuses, powerLine, elixirHint };
}

function atkLabel(locale: AppLocale): string {
  return ATK_LABEL[locale];
}
