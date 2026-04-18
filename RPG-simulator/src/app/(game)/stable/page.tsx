"use client";

import { useI18n } from "@/providers/I18nProvider";
import { STABLE_ANIMALS } from "@/lib/game/types";
import { useGameStore } from "@/stores/gameStore";

export default function StablePage() {
  const { t } = useI18n();
  const game = useGameStore((s) => s.game)!;
  const buyStableAnimal = useGameStore((s) => s.buyStableAnimal);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-white">{t("stable.title")}</h1>
        <p className="text-base text-vb-muted">Zkracují čas výprav v taverně (sčítají se do stropu).</p>
      </header>
      <div className="grid gap-3 md:grid-cols-2">
        {STABLE_ANIMALS.map((a) => {
          const owned = game.ownedAnimals.includes(a.id);
          return (
            <div key={a.id} className="vb-card flex flex-col gap-2 p-4">
              <div className="text-xl font-semibold text-white">{t(a.nameKey)}</div>
              <p className="text-base text-vb-muted">−{a.timeReductionPercent}% času výpravy</p>
              <p className="text-base text-amber-200">{a.priceGold} zlata</p>
              <button
                type="button"
                className="vb-btn vb-btn-primary mt-auto"
                disabled={owned}
                onClick={() => buyStableAnimal(a.id, a.priceGold)}
              >
                {owned ? t("stable.owned") : t("shop.buy")}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
