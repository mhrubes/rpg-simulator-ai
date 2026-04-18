import { nanoid } from "nanoid";
import type { GameItem, ItemKind, PlayerClass, StatKey, WeaponFamily } from "./types";
import { primaryStatForClass, shopItemPrice } from "./formulas";

const WEAPON_NAMES: Record<PlayerClass, string[]> = {
  knight: ["Ocelový meč", "Sekera bouře", "Těžký palcát", "Čepel úsvitu"],
  archer: ["Jílec lesa", "Dlouhý luk", "Kuše stínu", "Reflexní luk"],
  mage: ["Hůl větru", "Kouzelná hůlka", "Proutek jisker", "Hůl hvězd"],
};

function weaponFamilyForClass(pc: PlayerClass): WeaponFamily {
  if (pc === "knight") return "melee";
  if (pc === "archer") return "ranged";
  return "magic";
}

function rollStat(level: number, primary: StatKey, key: StatKey): number {
  const base = 2 + Math.floor(level / 2);
  if (key === primary) return base + 2 + Math.floor(level / 3);
  if (key === "vit") return 1 + Math.floor(level / 4);
  return 1 + Math.floor(level / 5);
}

export function generateShopWeapon(level: number, pc: PlayerClass): GameItem {
  const primary = primaryStatForClass(pc);
  const stats: Partial<Record<StatKey, number>> = {
    str: rollStat(level, primary, "str"),
    dex: rollStat(level, primary, "dex"),
    int: rollStat(level, primary, "int"),
    vit: rollStat(level, primary, "vit"),
  };
  const names = WEAPON_NAMES[pc];
  return {
    id: nanoid(),
    name: names[Math.floor(Math.random() * names.length)]!,
    kind: "weapon",
    weaponFamily: weaponFamilyForClass(pc),
    levelReq: Math.max(1, level - 1),
    stats,
    priceGold: shopItemPrice(level, "weapon"),
  };
}

export function generateShopArmorPiece(
  level: number,
  pc: PlayerClass,
  kind: "armor" | "helmet" | "boots" | "gloves",
): GameItem {
  const primary = primaryStatForClass(pc);
  const stats: Partial<Record<StatKey, number>> = {
    str: rollStat(level, primary, "str") - 1,
    dex: rollStat(level, primary, "dex") - 1,
    int: rollStat(level, primary, "int") - 1,
    vit: 2 + rollStat(level, primary, "vit"),
  };
  const label =
    kind === "armor"
      ? "Brnění"
      : kind === "helmet"
        ? "Přilba"
        : kind === "boots"
          ? "Boty"
          : "Rukavice";
  return {
    id: nanoid(),
    name: `${label} ${level}. řádu`,
    kind,
    levelReq: Math.max(1, level - 1),
    stats,
    priceGold: shopItemPrice(level, "armor"),
  };
}

export function generateTrinket(
  level: number,
  kind: "ring" | "amulet",
  stat: StatKey,
): GameItem {
  const value = 2 + Math.floor(level / 2);
  const stats: Partial<Record<StatKey, number>> = { [stat]: value, vit: 1 + Math.floor(level / 5) };
  const name =
    kind === "ring"
      ? `Prsten ${stat === "str" ? "síly" : stat === "dex" ? "obratnosti" : stat === "int" ? "inteligence" : "života"}`
      : `Amulet ${stat === "str" ? "síly" : stat === "dex" ? "obratnosti" : stat === "int" ? "inteligence" : "života"}`;
  return {
    id: nanoid(),
    name,
    kind,
    levelReq: Math.max(1, level - 1),
    stats,
    priceGold: shopItemPrice(level, "ring"),
    trinketDurationMs: 24 * 60 * 60 * 1000,
  };
}

export function generateElixir(level: number, stat: StatKey): GameItem {
  const bonus = 3 + Math.floor(level / 3);
  return {
    id: nanoid(),
    name: `Elixír ${stat === "str" ? "síly" : stat === "dex" ? "obratnosti" : stat === "int" ? "inteligence" : "života"}`,
    kind: "elixir",
    levelReq: 1,
    stats: {},
    priceGold: Math.round(30 + level * 10),
    elixirStat: stat,
    elixirDurationMs: 45 * 60 * 1000,
    unique: false,
  };
}

export function generateUniqueDrop(playerLevel: number, floor: number): GameItem {
  const primary: StatKey = floor % 3 === 0 ? "str" : floor % 3 === 1 ? "dex" : "int";
  const name = `Relikvie patra ${floor}`;
  return {
    id: nanoid(),
    name,
    kind: "weapon",
    weaponFamily: "magic",
    levelReq: Math.max(1, playerLevel - 2),
    stats: {
      [primary]: 6 + floor + Math.floor(playerLevel / 2),
      vit: 3 + floor,
    },
    priceGold: 0,
    unique: true,
  };
}
