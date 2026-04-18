import type { ExpeditionKind, PlayerClass, StatKey } from "./types";

export function xpToNextLevel(level: number): number {
  return Math.floor(80 + level * 45 + level * level * 6);
}

export function baseStatsForClass(pc: PlayerClass): Record<StatKey, number> {
  switch (pc) {
    case "knight":
      return { str: 8, dex: 4, int: 3, vit: 12 };
    case "archer":
      return { str: 4, dex: 9, int: 3, vit: 10 };
    case "mage":
      return { str: 3, dex: 4, int: 9, vit: 9 };
  }
}

export function primaryStatForClass(pc: PlayerClass): StatKey {
  if (pc === "knight") return "str";
  if (pc === "archer") return "dex";
  return "int";
}

export function questDurationSec(level: number, kind: ExpeditionKind): number {
  const base = 18 + level * 8;
  switch (kind) {
    case "gold":
      return Math.max(12, Math.round(base * 0.85));
    case "xp":
      return Math.max(14, Math.round(base * 1.05));
    default:
      return Math.max(13, Math.round(base));
  }
}

export function questRewards(level: number, kind: ExpeditionKind) {
  const scale = 1 + level * 0.22;
  switch (kind) {
    case "gold":
      return {
        gold: Math.round((35 + level * 18) * scale * 1.25),
        xp: Math.round((12 + level * 6) * scale * 0.55),
      };
    case "xp":
      return {
        gold: Math.round((18 + level * 9) * scale * 0.55),
        xp: Math.round((28 + level * 16) * scale * 1.25),
      };
    default:
      return {
        gold: Math.round((28 + level * 14) * scale),
        xp: Math.round((22 + level * 11) * scale),
      };
  }
}

export function patrolGoldPerHour(level: number): number {
  return Math.round(12 + level * 9 + level * level * 0.35);
}

export function shopItemPrice(level: number, slot: "weapon" | "armor" | "ring"): number {
  const m = slot === "weapon" ? 1.05 : slot === "armor" ? 1 : 0.85;
  return Math.round((40 + level * 22) * m);
}

export function stableReductionOwned(ids: string[]): number {
  const map: Record<string, number> = {
    pony: 5,
    wolf: 10,
    griffon: 18,
    drake: 28,
  };
  let total = 0;
  for (const id of ids) total += map[id] ?? 0;
  return Math.min(55, total);
}

export function guildUpgradeCost(id: "tavern_gold" | "tavern_xp", nextLevel: number): number {
  const base = id === "tavern_gold" ? 140 : 160;
  return Math.round(base * Math.pow(1.35, nextLevel - 1));
}

export function guildBonusPercent(level: number): number {
  if (level <= 0) return 0;
  return Math.min(12, 1.2 + (level - 1) * 0.9);
}
