"use client";

import { useI18n } from "@/providers/I18nProvider";
import { useGameStore } from "@/stores/gameStore";

const stats = ["str", "dex", "int", "vit"] as const;

export default function MagePage() {
  const { t } = useI18n();
  const buyRing = useGameStore((s) => s.buyRing);
  const buyAmulet = useGameStore((s) => s.buyAmulet);
  const buyElixir = useGameStore((s) => s.buyElixir);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-white">{t("shop.mage")}</h1>
        <p className="text-base text-vb-muted">Prsteny, amulety a lektvary s časovaným účinkem.</p>
      </header>
      <section className="vb-card p-4">
        <h2 className="text-base font-semibold text-sky-200/90">Prsteny</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {stats.map((s) => (
            <button key={s} type="button" className="vb-btn" onClick={() => buyRing(s)}>
              {t("shop.buy")} · {s}
            </button>
          ))}
        </div>
      </section>
      <section className="vb-card p-4">
        <h2 className="text-base font-semibold text-sky-200/90">Amulety</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {stats.map((s) => (
            <button key={s} type="button" className="vb-btn" onClick={() => buyAmulet(s)}>
              {t("shop.buy")} · {s}
            </button>
          ))}
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
