"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useI18n } from "@/providers/I18nProvider";
import { useGameStore } from "@/stores/gameStore";
import type { ExpeditionKind } from "@/lib/game/types";
import { questDurationSec, questRewards, stableReductionOwned } from "@/lib/game/formulas";
import { CombatStage } from "@/components/combat/CombatStage";

export default function TavernPage() {
  const { t } = useI18n();
  const game = useGameStore((s) => s.game)!;
  const startExpedition = useGameStore((s) => s.startExpedition);
  const finishExpeditionRewards = useGameStore((s) => s.finishExpeditionRewards);
  const sellPendingLoot = useGameStore((s) => s.sellPendingLoot);
  const stashPendingToOverflow = useGameStore((s) => s.stashPendingToOverflow);

  const patrolLock = game.patrol !== null && Date.now() < game.patrol.endsAt;
  const reduction = stableReductionOwned(game.ownedAnimals) / 100;

  const quests = useMemo(() => {
    const kinds: ExpeditionKind[] = ["gold", "xp", "balanced"];
    return kinds.map((kind) => {
      const baseSec = questDurationSec(game.level, kind);
      const durationMs = Math.max(8000, Math.round(baseSec * 1000 * (1 - reduction)));
      const r = questRewards(game.level, kind);
      return { kind, durationMs, gold: r.gold, xp: r.xp, durationSec: Math.round(durationMs / 1000) };
    });
  }, [game.level, reduction]);

  const expedition = game.expedition;

  /** Bez periodického překreslení se stránka neaktualizuje — ve store se během cesty nic nemění. */
  const [travelTick, setTravelTick] = useState(0);
  useEffect(() => {
    if (expedition?.phase !== "travel") return;
    const id = window.setInterval(() => setTravelTick((n) => n + 1), 100);
    return () => clearInterval(id);
  }, [expedition?.phase, expedition?.endsAt]);

  const travelProgress = useMemo(() => {
    if (!expedition || expedition.phase !== "travel") return { left: 0, pct: 0 };
    const now = Date.now();
    const duration =
      expedition.durationMs && expedition.durationMs > 0
        ? expedition.durationMs
        : Math.max(8000, expedition.endsAt - now);
    const started =
      expedition.startedAt != null && Number.isFinite(expedition.startedAt)
        ? expedition.startedAt
        : expedition.endsAt - duration;
    const total = Math.max(1, expedition.endsAt - started);
    const elapsed = now - started;
    const pct = Math.min(100, Math.max(0, (elapsed / total) * 100));
    const left = Math.max(0, expedition.endsAt - now);
    return { left, pct };
    // travelTick: pouze aby se useMemo přepočítal každých 100 ms během cesty
  }, [expedition, travelTick]);

  const wf = game.equipment.weapon?.weaponFamily;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-white">{t("tavern.title")}</h1>
        <p className="text-base text-vb-muted">{t("tavern.npc")}</p>
      </header>

      {game.pendingTavernLoot && (
        <div className="vb-card border-amber-500/40 p-4">
          <h2 className="text-lg font-semibold text-amber-100">{t("tavern.pendingTitle")}</h2>
          <p className="mt-1 text-base text-vb-muted">{game.pendingTavernLoot.name}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className="vb-btn vb-btn-primary" onClick={() => sellPendingLoot()}>
              {t("tavern.pendingSell")}
            </button>
            <button type="button" className="vb-btn" onClick={() => stashPendingToOverflow()}>
              {t("tavern.pendingOverflow")}
            </button>
          </div>
        </div>
      )}

      {expedition && expedition.phase === "travel" && (
        <div className="vb-card p-5">
          <h2 className="text-lg font-semibold text-white">{t("tavern.expedition")}</h2>
          <p className="mt-1 text-base text-vb-muted">
            {t("tavern.remaining")}: {Math.ceil(travelProgress.left / 1000)} s
          </p>
          <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-black/50">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-700 to-amber-300 transition-[width] duration-100 ease-linear"
              style={{ width: `${travelProgress.pct}%` }}
            />
          </div>
        </div>
      )}

      {expedition && expedition.phase === "combat" && (
        <div className="vb-card space-y-4 p-5">
          <h2 className="text-lg font-semibold text-amber-100">{t("tavern.fight")}</h2>
          <p className="text-base text-vb-muted">
            {expedition.monsterName} · L{expedition.monsterLevel}
          </p>
          <CombatStage
            key={`${expedition.endsAt}-${expedition.monsterName}`}
            weaponFamily={wf}
            monsterName={expedition.monsterName}
            onDone={() => finishExpeditionRewards()}
          />
        </div>
      )}

      {!expedition && (
        <div className="grid gap-4 md:grid-cols-3">
          {quests.map((q) => (
            <div key={q.kind} className="vb-card flex flex-col p-4">
              <h3 className="text-lg font-semibold text-white">
                {q.kind === "gold" ? t("tavern.questGold") : q.kind === "xp" ? t("tavern.questXp") : t("tavern.questMix")}
              </h3>
              <p className="mt-2 text-base text-vb-muted">
                {t("tavern.reward")}: {q.gold} {t("common.gold").toLowerCase()}, {q.xp} XP
              </p>
              <p className="text-base text-vb-muted">
                {t("tavern.duration")}: {q.durationSec}s
              </p>
              <button
                type="button"
                className="vb-btn vb-btn-primary mt-auto"
                disabled={patrolLock || !!game.expedition}
                onClick={() => {
                  const r = startExpedition(q.kind);
                  if (!r.ok && r.reason === "patrol") toast.error(t("tavern.lockedPatrol"));
                  if (!r.ok && r.reason === "busy") toast.error(t("tavern.lockedBusy"));
                }}
              >
                {t("tavern.start")}
              </button>
            </div>
          ))}
        </div>
      )}

      {!expedition && patrolLock && (
        <p className="text-base text-amber-200/90">{t("tavern.lockedPatrol")}</p>
      )}
    </div>
  );
}
