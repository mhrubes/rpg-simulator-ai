"use client";

import { useState } from "react";
import { useI18n } from "@/providers/I18nProvider";
import { useGameStore } from "@/stores/gameStore";
import type { EquipmentState, GameItem, PlayerClass } from "@/lib/game/types";
import { totalStats } from "@/lib/game/stats";
import { xpToNextLevel, primaryStatForClass } from "@/lib/game/formulas";
import { motion } from "framer-motion";
import { itemFitsEquipmentSlot } from "@/lib/game/equipment";
import { getItemDetailLines } from "@/lib/game/itemDisplay";
import type { AppLocale } from "@/i18n/messages";

type SlotRef =
  | { k: "inv"; i: number }
  | { k: "eq"; e: keyof EquipmentState }
  | { k: "overflow" }
  | { k: "trash" };

function parseSlot(data: string): SlotRef | null {
  if (data === "overflow") return { k: "overflow" };
  if (data === "trash") return { k: "trash" };
  if (data.startsWith("inv:")) return { k: "inv", i: Number(data.slice(4)) };
  if (data.startsWith("eq:")) return { k: "eq", e: data.slice(3) as keyof EquipmentState };
  return null;
}

function slotId(s: SlotRef): string {
  if (s.k === "inv") return `inv:${s.i}`;
  if (s.k === "eq") return `eq:${s.e}`;
  return s.k;
}

function ItemCell({
  item,
  sid,
  locale,
  playerClass,
  onDouble,
}: {
  item: GameItem | null;
  sid: string;
  locale: AppLocale;
  playerClass: PlayerClass;
  onDouble?: () => void;
}) {
  const details = item ? getItemDetailLines(item, locale, playerClass) : null;

  return (
    <div
      draggable={!!item}
      onDragStart={(e) => {
        if (!item) return;
        e.dataTransfer.setData("slot", sid);
        e.dataTransfer.effectAllowed = "move";
      }}
      onDoubleClick={() => onDouble?.()}
      className={`flex min-h-[88px] flex-col justify-start gap-1 rounded-lg border px-2.5 py-2 text-left text-base ${
        item
          ? "cursor-grab border-vb-border bg-black/35 active:cursor-grabbing"
          : "border-dashed border-vb-border/60 bg-black/20 text-vb-muted"
      }`}
    >
      {item ? (
        <>
          <span className="line-clamp-2 font-semibold leading-snug text-white">{item.name}</span>
          {details?.powerLine && (
            <span className="text-sm font-semibold text-amber-200/95">{details.powerLine}</span>
          )}
          {details?.bonuses.map((line) => (
            <span key={line} className="text-sm leading-snug text-emerald-200/90">
              {line}
            </span>
          ))}
          {details?.elixirHint && (
            <span className="text-sm text-sky-200/90">{details.elixirHint}</span>
          )}
          <span className="mt-auto truncate border-t border-white/5 pt-0.5 text-sm text-vb-muted">
            L{item.levelReq} · {item.priceGold}g
            {item.unique ? " · ★" : ""}
          </span>
        </>
      ) : (
        <span className="text-sm">—</span>
      )}
    </div>
  );
}

export default function PlayerPage() {
  const { t, locale } = useI18n();
  const game = useGameStore((s) => s.game)!;
  const patch = useGameStore((s) => s.patch);
  const swapInventory = useGameStore((s) => s.swapInventory);
  const equipFromInventory = useGameStore((s) => s.equipFromInventory);
  const unequipToInventory = useGameStore((s) => s.unequipToInventory);
  const useElixir = useGameStore((s) => s.useElixir);
  const destroyInventory = useGameStore((s) => s.destroyInventory);
  const moveInventoryToOverflow = useGameStore((s) => s.moveInventoryToOverflow);

  const [trashModal, setTrashModal] = useState<number | null>(null);

  const stats = totalStats(game);
  const prim = primaryStatForClass(game.playerClass);
  const xpNeed = xpToNextLevel(game.level);

  function onDrop(target: SlotRef, dataTransfer: DataTransfer) {
    const raw = dataTransfer.getData("slot");
    const from = parseSlot(raw);
    if (!from || !target) return;

    if (target.k === "trash") {
      if (from.k === "inv" && game.inventory[from.i]) setTrashModal(from.i);
      return;
    }

    if (from.k === "inv" && target.k === "inv") {
      swapInventory(from.i, target.i);
      return;
    }
    if (from.k === "inv" && target.k === "eq") {
      equipFromInventory(from.i, target.e);
      return;
    }
    if (from.k === "eq" && target.k === "inv") {
      unequipToInventory(from.e, target.i);
      return;
    }
    if (from.k === "inv" && target.k === "overflow") {
      moveInventoryToOverflow(from.i);
      return;
    }
    if (from.k === "overflow" && target.k === "inv") {
      const it = game.overflow.item;
      if (!it || game.inventory[target.i]) return;
      patch((s) => {
        const inv = [...s.inventory];
        inv[target.i] = it;
        return { ...s, inventory: inv, overflow: { item: null, expiresAt: null } };
      });
      return;
    }
    if (from.k === "overflow" && target.k === "eq") {
      const it = game.overflow.item;
      if (!it || !itemFitsEquipmentSlot(it, target.e) || it.levelReq > game.level) return;
      patch((s) => {
        const cur = s.equipment[target.e];
        if (cur) return s;
        const eq = { ...s.equipment, [target.e]: it } as EquipmentState;
        return { ...s, equipment: eq, overflow: { item: null, expiresAt: null } };
      });
    }
  }

  const equipOrder: (keyof EquipmentState)[] = [
    "weapon",
    "helmet",
    "armor",
    "gloves",
    "boots",
    "amulet",
    "ring1",
    "ring2",
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-white">{t("player.title")}</h1>
        <p className="text-base text-vb-muted">
          {t("player.xp")}: {game.xp} / {xpNeed}
        </p>
      </header>

      <div className="vb-card p-5">
        <h2 className="text-base font-semibold text-amber-200/90">{t("player.stats")}</h2>
        <div className="mt-3 grid grid-cols-2 gap-2 text-base md:grid-cols-4">
          {(["str", "dex", "int", "vit"] as const).map((k) => (
            <div key={k} className="rounded-lg border border-vb-border bg-black/25 px-3 py-2">
              <div className="text-sm uppercase text-vb-muted">{k}</div>
              <div className={k === prim ? "text-xl font-bold text-amber-200" : "text-xl font-semibold text-white"}>
                {stats[k]}
                {k === prim ? " ★" : ""}
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-base text-vb-muted">
          {t("common.level")} {game.level} · {t("common.honor")} {game.honor}
        </p>
      </div>

      <div className="vb-card p-5">
        <h2 className="text-base font-semibold text-amber-200/90">{t("player.equip")}</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {equipOrder.map((e) => (
            <div
              key={e}
              onDragOver={(ev) => ev.preventDefault()}
              onDrop={(ev) => {
                ev.preventDefault();
                onDrop({ k: "eq", e }, ev.dataTransfer);
              }}
            >
              <div className="mb-1 text-sm uppercase text-vb-muted">{e}</div>
              <ItemCell item={game.equipment[e]} sid={slotId({ k: "eq", e })} locale={locale} playerClass={game.playerClass} />
            </div>
          ))}
        </div>
      </div>

      <div className="vb-card p-5">
        <h2 className="text-base font-semibold text-amber-200/90">{t("player.inventory")}</h2>
        <p className="mt-1 text-base text-vb-muted">Dvojklik na elixír = použít.</p>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
          {game.inventory.map((it, i) => (
            <div
              key={i}
              onDragOver={(ev) => ev.preventDefault()}
              onDrop={(ev) => {
                ev.preventDefault();
                onDrop({ k: "inv", i }, ev.dataTransfer);
              }}
            >
              <ItemCell
                item={it}
                sid={slotId({ k: "inv", i })}
                locale={locale}
                playerClass={game.playerClass}
                onDouble={() => {
                  if (it?.kind === "elixir") useElixir(i);
                }}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div
          className="vb-card border-dashed p-4"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            onDrop({ k: "overflow" }, e.dataTransfer);
          }}
        >
          <h3 className="text-base font-semibold text-amber-200/90">{t("player.overflow")}</h3>
          {game.overflow.expiresAt && (
            <p className="text-sm text-red-300">
              {Math.max(0, Math.ceil((game.overflow.expiresAt - Date.now()) / 1000))}s
            </p>
          )}
          <div className="mt-2">
            <ItemCell item={game.overflow.item} sid="overflow" locale={locale} playerClass={game.playerClass} />
          </div>
        </div>
        <div
          className="vb-card border border-red-900/40 bg-red-950/20 p-4"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            onDrop({ k: "trash" }, e.dataTransfer);
          }}
        >
          <h3 className="text-base font-semibold text-red-200">{t("player.trash")}</h3>
          <p className="mt-2 text-base text-vb-muted">Přesuň sem předmět z inventáře.</p>
        </div>
      </div>

      {trashModal !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="vb-card max-w-sm p-6">
            <p className="text-base text-white">Zničit předmět z inventáře?</p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                className="vb-btn flex-1"
                onClick={() => setTrashModal(null)}
              >
                Zrušit
              </button>
              <button
                type="button"
                className="vb-btn flex-1 border-red-700 bg-red-950/40 text-red-200"
                onClick={() => {
                  destroyInventory(trashModal);
                  setTrashModal(null);
                }}
              >
                Zničit
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
