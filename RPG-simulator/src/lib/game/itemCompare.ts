import type { AppLocale } from "@/i18n/messages";
import { estimatedWeaponPower, statShortLabel } from "@/lib/game/itemDisplay";
import type { EquipmentState, GameItem, PlayerClass, StatKey } from "@/lib/game/types";

const STAT_ORDER: StatKey[] = ["str", "dex", "int", "vit"];

const ATK_LABEL: Record<AppLocale, string> = {
  cs: "Útok",
  en: "Atk",
};

function sumStatPoints(item: GameItem): number {
  let s = 0;
  for (const k of STAT_ORDER) s += item.stats[k] ?? 0;
  return s;
}

/** U dvou prstenů porovnáváme proti slabšímu (typicky ho vyměníš dřív). */
export function ringComparisonSlot(eq: EquipmentState): "ring1" | "ring2" | null {
  const r1 = eq.ring1;
  const r2 = eq.ring2;
  if (!r1 && !r2) return null;
  if (r1 && !r2) return "ring1";
  if (!r1 && r2) return "ring2";
  return sumStatPoints(r1!) <= sumStatPoints(r2!) ? "ring1" : "ring2";
}

export function comparisonEquipmentKey(
  item: GameItem,
  eq: EquipmentState,
): keyof EquipmentState | null {
  switch (item.kind) {
    case "weapon":
      return "weapon";
    case "armor":
      return "armor";
    case "helmet":
      return "helmet";
    case "boots":
      return "boots";
    case "gloves":
      return "gloves";
    case "amulet":
      return "amulet";
    case "ring":
      return ringComparisonSlot(eq);
    case "elixir":
      return null;
    default:
      return null;
  }
}

export type ComparisonLine = { text: string; better: boolean; worse: boolean };

export function getItemComparisonLines(
  candidate: GameItem,
  equipped: GameItem | null,
  locale: AppLocale,
  playerClass: PlayerClass,
): ComparisonLine[] {
  if (!equipped) return [];

  const out: ComparisonLine[] = [];

  if (candidate.kind === "weapon" && equipped.kind === "weapon") {
    const a = estimatedWeaponPower(candidate, playerClass);
    const b = estimatedWeaponPower(equipped, playerClass);
    if (a != null && b != null) {
      const d = a - b;
      if (d !== 0) {
        const sign = d > 0 ? "+" : "";
        out.push({
          text: `${ATK_LABEL[locale]} ${sign}${d}`,
          better: d > 0,
          worse: d < 0,
        });
      }
    }
  }

  for (const k of STAT_ORDER) {
    const c = candidate.stats[k] ?? 0;
    const e = equipped.stats[k] ?? 0;
    const d = c - e;
    if (d === 0) continue;
    const sign = d > 0 ? "+" : "";
    out.push({
      text: `${sign}${d} ${statShortLabel(locale, k)}`,
      better: d > 0,
      worse: d < 0,
    });
  }

  return out;
}

/** „Stejný“ kus výstroje — není co porovnávat. */
export function isSameEquippedItem(candidate: GameItem, equipped: GameItem | null): boolean {
  return equipped != null && equipped.id === candidate.id;
}
