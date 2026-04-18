import { generateShopArmorPiece, generateShopWeapon } from "./items";
import type { GameItem, PlayerClass } from "./types";

export type BlacksmithOfferSlot = "weapon" | "helmet" | "armor" | "gloves" | "boots";

export type BlacksmithOffers = Record<BlacksmithOfferSlot, GameItem>;

export const BLACKSMITH_REFRESH_DIAMOND_COST = 1;

export function rollBlacksmithOffers(level: number, playerClass: PlayerClass): BlacksmithOffers {
  return {
    weapon: generateShopWeapon(level, playerClass),
    helmet: generateShopArmorPiece(level, playerClass, "helmet"),
    armor: generateShopArmorPiece(level, playerClass, "armor"),
    gloves: generateShopArmorPiece(level, playerClass, "gloves"),
    boots: generateShopArmorPiece(level, playerClass, "boots"),
  };
}
