import type { GameSaveV1 } from "@/lib/game/initialSave";
import { saveKeyForUser } from "./keys";

export function loadSave(userId: string): GameSaveV1 | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(saveKeyForUser(userId));
    if (!raw) return null;
    return JSON.parse(raw) as GameSaveV1;
  } catch {
    return null;
  }
}

export function writeSave(save: GameSaveV1) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(saveKeyForUser(save.userId), JSON.stringify(save));
}
