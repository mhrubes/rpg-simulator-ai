import type { EquipmentState, GameItem, ItemKind } from "./types";

export function itemFitsEquipmentSlot(item: GameItem, slot: keyof EquipmentState): boolean {
  const kind = item.kind as ItemKind;
  if (slot === "weapon") return kind === "weapon";
  if (slot === "armor") return kind === "armor";
  if (slot === "helmet") return kind === "helmet";
  if (slot === "boots") return kind === "boots";
  if (slot === "gloves") return kind === "gloves";
  if (slot === "amulet") return kind === "amulet";
  if (slot === "ring1" || slot === "ring2") return kind === "ring";
  return false;
}
