import type { ExpeditionKind, ExpeditionRuntime } from "./types";
import { questDurationSec, questRewards, stableReductionOwned } from "./formulas";

const MONSTERS = [
  "Krysí šlechtic",
  "Slizoun z kanálu",
  "Netopýr rudých křídel",
  "Ghúl kořenář",
  "Kostěný pěšák",
  "Stín z propasti",
  "Ohnivý elementál",
  "Temný skřet",
];

export function createExpedition(
  level: number,
  kind: ExpeditionKind,
  ownedAnimals: string[],
): ExpeditionRuntime {
  const reduction = stableReductionOwned(ownedAnimals) / 100;
  const baseSec = questDurationSec(level, kind);
  const durationMs = Math.max(8000, Math.round(baseSec * 1000 * (1 - reduction)));
  const rewards = questRewards(level, kind);
  const startedAt = Date.now();
  return {
    kind,
    startedAt,
    endsAt: startedAt + durationMs,
    durationMs,
    goldReward: rewards.gold,
    xpReward: rewards.xp,
    monsterName: MONSTERS[Math.floor(Math.random() * MONSTERS.length)]!,
    monsterLevel: Math.max(1, level + Math.floor(Math.random() * 3) - 1),
    phase: "travel",
  };
}

export function expeditionShouldEnterCombat(ex: ExpeditionRuntime | null): boolean {
  if (!ex || ex.phase !== "travel") return false;
  return Date.now() >= ex.endsAt;
}

export function rollPostQuestDiamond(): boolean {
  return Math.random() < 0.02;
}

export function rollPostQuestItem(): boolean {
  return Math.random() < 0.12;
}
