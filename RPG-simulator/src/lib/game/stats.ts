import type { GameSaveV1 } from "@/lib/game/initialSave";
import type { EquipmentState, GameItem, StatKey } from "./types";

function sumItemStats(item: GameItem | null): Record<StatKey, number> {
  const acc: Record<StatKey, number> = { str: 0, dex: 0, int: 0, vit: 0 };
  if (!item?.stats) return acc;
  for (const k of Object.keys(item.stats) as StatKey[]) {
    acc[k] += item.stats[k] ?? 0;
  }
  return acc;
}

function sumEquipment(eq: EquipmentState): Record<StatKey, number> {
  const keys: (keyof EquipmentState)[] = [
    "weapon",
    "armor",
    "helmet",
    "boots",
    "gloves",
    "amulet",
    "ring1",
    "ring2",
  ];
  const acc: Record<StatKey, number> = { str: 0, dex: 0, int: 0, vit: 0 };
  for (const k of keys) {
    const s = sumItemStats(eq[k]);
    for (const st of Object.keys(s) as StatKey[]) acc[st] += s[st];
  }
  return acc;
}

export function totalStats(save: GameSaveV1): Record<StatKey, number> {
  const eq = sumEquipment(save.equipment);
  const base = { ...save.baseStats };
  const buffs = save.activeBuffs.reduce(
    (a, b) => {
      a[b.stat] = (a[b.stat] ?? 0) + b.value;
      return a;
    },
    {} as Partial<Record<StatKey, number>>,
  );
  const out: Record<StatKey, number> = { str: 0, dex: 0, int: 0, vit: 0 };
  for (const st of Object.keys(out) as StatKey[]) {
    out[st] = base[st] + eq[st] + (buffs[st] ?? 0);
  }
  return out;
}

export function recomputeMaxVitality(save: GameSaveV1): number {
  const vit = totalStats(save).vit;
  return 36 + vit * 4 + save.level * 2;
}
