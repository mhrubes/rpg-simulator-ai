"use client";

import { toast } from "sonner";
import { useI18n } from "@/providers/I18nProvider";
import { useGameStore } from "@/stores/gameStore";
import type { BlacksmithOfferSlot } from "@/lib/game/blacksmithShop";
import { BLACKSMITH_REFRESH_DIAMOND_COST } from "@/lib/game/blacksmithShop";
import { getItemDetailLines } from "@/lib/game/itemDisplay";

const SLOTS: BlacksmithOfferSlot[] = ["weapon", "helmet", "armor", "gloves", "boots"];

const SLOT_LABEL: Record<BlacksmithOfferSlot, string> = {
  weapon: "shop.slot.weapon",
  helmet: "shop.slot.helmet",
  armor: "shop.slot.armor",
  gloves: "shop.slot.gloves",
  boots: "shop.slot.boots",
};

export default function BlacksmithPage() {
  const { t, locale } = useI18n();
  const game = useGameStore((s) => s.game)!;
  const buyWeapon = useGameStore((s) => s.buyWeapon);
  const buyArmor = useGameStore((s) => s.buyArmor);
  const refreshBlacksmithOffers = useGameStore((s) => s.refreshBlacksmithOffers);

  const offers = game.blacksmithOffers;
  if (!offers) return null;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">{t("shop.blacksmith")}</h1>
          <p className="text-base text-vb-muted">Zbraně a kovové díly podle tvé třídy a úrovně.</p>
        </div>
        <div className="flex flex-col items-stretch gap-2 sm:items-end">
          <button
            type="button"
            className="vb-btn border-sky-500/40 text-sky-200"
            onClick={() => {
              const r = refreshBlacksmithOffers();
              if (!r.ok) toast.error(t("shop.needDiamond"));
            }}
          >
            {t("shop.refreshOffers")} ({BLACKSMITH_REFRESH_DIAMOND_COST} {t("common.diamonds").toLowerCase()})
          </button>
          <p className="max-w-xs text-right text-sm text-vb-muted">{t("shop.refreshOffersDetail")}</p>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {SLOTS.map((slot) => {
          const item = offers[slot];
          const details = getItemDetailLines(item, locale, game.playerClass);
          const canBuy = game.gold >= item.priceGold;
          const invFull = game.inventory.every((x) => x !== null);

          return (
            <div
              key={slot}
              className={`vb-card flex flex-col gap-2.5 p-5 ${slot === "weapon" ? "ring-1 ring-amber-500/35" : ""}`}
            >
              <div className="text-sm font-bold uppercase tracking-wide text-amber-200/90">{t(SLOT_LABEL[slot])}</div>
              <div className="text-base font-semibold leading-snug text-white">{item.name}</div>
              {details.powerLine && (
                <span className="text-sm font-semibold text-amber-200/95">{details.powerLine}</span>
              )}
              {details.bonuses.map((line) => (
                <span key={`${slot}-${line}`} className="text-sm text-emerald-200/90">
                  {line}
                </span>
              ))}
              <div className="mt-1 text-base text-amber-200">
                {item.priceGold} {t("common.gold").toLowerCase()}
                <span className="text-vb-muted"> · L{item.levelReq}</span>
              </div>
              <button
                type="button"
                className="vb-btn vb-btn-primary mt-auto"
                disabled={!canBuy || invFull}
                onClick={() => {
                  const r = slot === "weapon" ? buyWeapon() : buyArmor(slot);
                  if (!r.ok && invFull) toast.error(t("shop.fullInv"));
                  if (!r.ok && !invFull && !canBuy) toast.error(t("shop.needGold"));
                }}
              >
                {t("shop.buy")}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
