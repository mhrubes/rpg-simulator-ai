"use client";

import { useState } from "react";
import { useI18n } from "@/providers/I18nProvider";
import { useGameStore } from "@/stores/gameStore";
import { CombatStage } from "@/components/combat/CombatStage";
import { generateUniqueDrop } from "@/lib/game/items";
import { UNDERWORLD_FLOOR_COOLDOWN_MS } from "@/lib/game/types";

export default function UnderworldPage() {
  const { t } = useI18n();
  const game = useGameStore((s) => s.game)!;
  const attempt = useGameStore((s) => s.attemptUnderworldFloor);
  const complete = useGameStore((s) => s.completeUnderworldFloor);
  const [fight, setFight] = useState<number | null>(null);

  const patrolLock = game.patrol !== null && Date.now() < game.patrol.endsAt;
  const floors = Array.from({ length: 10 }, (_, i) => i + 1);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-white">{t("underworld.title")}</h1>
        <p className="text-base text-vb-muted">Každé patro jen jednou. Mezi pokusy čekání.</p>
      </header>

      {fight !== null && (
        <div className="vb-card p-4">
          <CombatStage
            weaponFamily={game.equipment.weapon?.weaponFamily}
            monsterName={`Strážce patra ${fight}`}
            onDone={() => {
              const loot = Math.random() < 0.08 ? generateUniqueDrop(game.level, fight) : null;
              complete(fight, true, loot);
              setFight(null);
            }}
          />
        </div>
      )}

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        {floors.map((f) => {
          const done = game.underworld.completedFloors.includes(f);
          const last = game.underworld.lastAttemptByFloor[f] ?? 0;
          const cdLeft = Math.max(0, UNDERWORLD_FLOOR_COOLDOWN_MS - (Date.now() - last));
          const canTry = attempt(f).ok && !done && !patrolLock && !game.expedition && fight === null;

          return (
            <div key={f} className="vb-card flex flex-col gap-2 p-3">
              <div className="text-base font-bold text-white">
                {t("underworld.floor")} {f}
              </div>
              {done ? (
                <span className="text-sm text-emerald-300">{t("underworld.done")}</span>
              ) : cdLeft > 0 ? (
                <span className="text-sm text-vb-muted">
                  {t("underworld.cooldown")}: {Math.ceil(cdLeft / 1000)}s
                </span>
              ) : (
                <span className="text-sm text-vb-muted">Lv netvora ≥ {Math.max(10, game.level)}</span>
              )}
              <button
                type="button"
                className="vb-btn vb-btn-primary mt-auto"
                disabled={!canTry || cdLeft > 0}
                onClick={() => {
                  const r = attempt(f);
                  if (r.ok) setFight(f);
                }}
              >
                {t("underworld.fight")}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
