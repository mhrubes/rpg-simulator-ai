"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useI18n } from "@/providers/I18nProvider";
import { useGameStore } from "@/stores/gameStore";
import { patrolGoldPerHour } from "@/lib/game/formulas";

export default function PatrolPage() {
  const { t } = useI18n();
  const game = useGameStore((s) => s.game)!;
  const startPatrol = useGameStore((s) => s.startPatrol);
  const cancelPatrol = useGameStore((s) => s.cancelPatrol);
  const [hours, setHours] = useState(2);

  const active = game.patrol !== null && Date.now() < game.patrol.endsAt;
  const reward = patrolGoldPerHour(game.level) * hours;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-white">{t("patrol.title")}</h1>
        <p className="text-base text-amber-200/80">{t("patrol.note")}</p>
      </header>

      {active && game.patrol && (
        <div className="vb-card p-5">
          <p className="text-base text-white">
            {t("patrol.title")} · {game.patrol.hours}h · zbývá{" "}
            {Math.max(0, Math.ceil((game.patrol.endsAt - Date.now()) / 60000))} min
          </p>
          <p className="mt-2 text-base text-vb-muted">Odměna: {game.patrol.goldReward} zlata</p>
          <button type="button" className="vb-btn mt-4 border-red-800 text-red-200" onClick={() => cancelPatrol()}>
            {t("patrol.cancel")}
          </button>
        </div>
      )}

      {!active && (
        <div className="vb-card max-w-md space-y-4 p-5">
          <label className="block text-base text-vb-muted">{t("patrol.hours")}</label>
          <input
            type="number"
            min={1}
            max={10}
            className="vb-input"
            value={hours}
            onChange={(e) => setHours(Number(e.target.value))}
          />
          <p className="text-base text-white">
            {t("patrol.reward")}: {reward} {t("common.gold").toLowerCase()}
          </p>
          <button
            type="button"
            className="vb-btn vb-btn-primary"
            disabled={!!game.expedition}
            onClick={() => {
              const r = startPatrol(hours);
              if (!r.ok) {
                if (r.reason === "expedition") toast.error(t("patrol.cannotExpedition"));
                else if (r.reason === "already") toast.error(t("patrol.cannotAlready"));
                else toast.error(t("patrol.cannotStart"));
              }
            }}
          >
            {t("patrol.start")}
          </button>
        </div>
      )}
    </div>
  );
}
