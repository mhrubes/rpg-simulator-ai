import { ARENA_COOLDOWN_MS } from "@/lib/game/types";
import { arenaKeyForUser } from "./keys";

export function arenaCooldownRemainingMs(userId: string): number {
  if (typeof window === "undefined") return 0;
  const raw = window.localStorage.getItem(arenaKeyForUser(userId));
  if (!raw) return 0;
  const last = Number(raw);
  if (!Number.isFinite(last)) return 0;
  const left = ARENA_COOLDOWN_MS - (Date.now() - last);
  return Math.max(0, left);
}

export function markArenaAttack(userId: string) {
  window.localStorage.setItem(arenaKeyForUser(userId), String(Date.now()));
}
