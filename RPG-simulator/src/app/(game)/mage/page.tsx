"use client";

import { useMemo } from "react";
import { useI18n } from "@/providers/I18nProvider";
import { useUiPrefs } from "@/providers/UiPrefsProvider";
import { useGameStore } from "@/stores/gameStore";
import { generateTrinket } from "@/lib/game/items";
import { getItemDetailLines } from "@/lib/game/itemDisplay";
import { comparisonEquipmentKey, isSameEquippedItem } from "@/lib/game/itemCompare";
import { ItemStatCompare } from "@/components/items/ItemStatCompare";
import type { GameItem, StatKey } from "@/lib/game/types";

const stats: StatKey[] = ["str", "dex", "int", "vit"];

export default function MagePage() {
  const { t, locale } = useI18n();
  const { itemCompareEnabled } = useUiPrefs();
  const game = useGameStore((s) => s.game)!;
  const buyRing = useGameStore((s) => s.buyRing);
  const buyAmulet = useGameStore((s) => s.buyAmulet);
  const buyElixir = useGameStore((s) => s.buyElixir);

  const previews = useMemo(() => {
    const lv = game.level;
    return {
      ring: Object.fromEntries(stats.map((s) => [s, generateTrinket(lv, "ring", s)])) as Record<StatKey, GameItem>,
      amulet: Object.fromEntries(stats.map((s) => [s, generateTrinket(lv, "amulet", s)])) as Record<StatKey, GameItem>,
    };
  }, [game.level]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-white">{t("shop.mage")}</h1>
        <p className="text-base text-vb-muted">Prsteny, amulety a lektvary s časovaným účinkem.</p>
      </header>
      <section className="vb-card p-4">
        <h2 className="text-base font-semibold text-sky-200/90">Prsteny</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((s) => {
            const item = previews.ring[s]!;
            const details = getItemDetailLines(item, locale, game.playerClass);
            const cmpKey = comparisonEquipmentKey(item, game.equipment);
            const equipped = cmpKey ? game.equipment[cmpKey] : null;
            const showCompare =
              itemCompareEnabled && equipped != null && !isSameEquippedItem(item, equipped);
            return (
              <div key={s} className="flex min-h-[11rem] flex-col gap-2 rounded-lg border border-vb-border bg-black/25 p-3">
                <div className="text-xs font-bold uppercase tracking-wide text-sky-200/80">{s}</div>
                <div className="text-sm font-semibold text-white">{item.name}</div>
                {details.bonuses.map((line) => (
                  <span key={line} className="text-sm text-emerald-200/90">
                    {line}
                  </span>
                ))}
                <ItemStatCompare
                  enabled={showCompare}
                  candidate={item}
                  equipped={equipped}
                  locale={locale}
                  playerClass={game.playerClass}
                />
                <div className="text-sm text-amber-200">
                  {item.priceGold} {t("common.gold").toLowerCase()}
                </div>
                <button type="button" className="vb-btn vb-btn-primary mt-auto shrink-0" onClick={() => buyRing(s)}>
                  {t("shop.buy")}
                </button>
              </div>
            );
          })}
        </div>
      </section>
      <section className="vb-card p-4">
        <h2 className="text-base font-semibold text-sky-200/90">Amulety</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((s) => {
            const item = previews.amulet[s]!;
            const details = getItemDetailLines(item, locale, game.playerClass);
            const equipped = game.equipment.amulet;
            const showCompare =
              itemCompareEnabled && equipped != null && !isSameEquippedItem(item, equipped);
            return (
              <div key={s} className="flex min-h-[11rem] flex-col gap-2 rounded-lg border border-vb-border bg-black/25 p-3">
                <div className="text-xs font-bold uppercase tracking-wide text-sky-200/80">{s}</div>
                <div className="text-sm font-semibold text-white">{item.name}</div>
                {details.bonuses.map((line) => (
                  <span key={line} className="text-sm text-emerald-200/90">
                    {line}
                  </span>
                ))}
                <ItemStatCompare
                  enabled={showCompare}
                  candidate={item}
                  equipped={equipped}
                  locale={locale}
                  playerClass={game.playerClass}
                />
                <div className="text-sm text-amber-200">
                  {item.priceGold} {t("common.gold").toLowerCase()}
                </div>
                <button type="button" className="vb-btn vb-btn-primary mt-auto shrink-0" onClick={() => buyAmulet(s)}>
                  {t("shop.buy")}
                </button>
              </div>
            );
          })}
        </div>
      </section>
      <section className="vb-card p-4">
        <h2 className="text-base font-semibold text-sky-200/90">Elixíry</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {stats.map((s) => (
            <button key={s} type="button" className="vb-btn" onClick={() => buyElixir(s)}>
              {t("shop.buy")} · {s}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
