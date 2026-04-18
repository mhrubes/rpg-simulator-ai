"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { WeaponFamily } from "@/lib/game/types";
import { useI18n } from "@/providers/I18nProvider";

type Props = {
  weaponFamily?: WeaponFamily;
  monsterName: string;
  onDone: () => void;
};

export function CombatStage({ weaponFamily, monsterName, onDone }: Props) {
  const { t } = useI18n();

  useEffect(() => {
    const id = window.setTimeout(onDone, 6200);
    return () => window.clearTimeout(id);
  }, [onDone]);

  const strike =
    weaponFamily === "ranged"
      ? { key: "arrow", x: [0, 120, 120], opacity: [1, 1, 0] }
      : weaponFamily === "magic"
        ? { key: "bolt", scale: [0.6, 1.2, 0.4], opacity: [0.9, 1, 0] }
        : { key: "slash", rotate: [-18, 24, 0], x: [0, 40, 0] };

  return (
    <div className="relative flex h-56 w-full max-w-3xl items-end justify-between gap-6 overflow-hidden rounded-xl border border-vb-border bg-gradient-to-b from-[#1a1424] to-vb-bg px-8 pb-6 pt-10">
      <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_30%_20%,#f4b94255,transparent_40%),radial-gradient(circle_at_80%_30%,#4f8cff33,transparent_45%)]" />

      <div className="relative z-10 flex flex-col items-center gap-2">
        <span className="text-sm uppercase tracking-widest text-vb-muted">{t("combat.player")}</span>
        <motion.div
          className="h-28 w-20 rounded-lg border border-amber-500/30 bg-gradient-to-b from-amber-900/50 to-vb-panel"
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="mt-2 h-1 w-24 rounded-full bg-amber-500/40"
          animate={{ scaleX: [0.4, 1, 0.4] }}
          transition={{ duration: 1.1, repeat: Infinity }}
        />
        <AnimatePresence>
          <motion.div
            key={strike.key}
            className={
              weaponFamily === "ranged"
                ? "pointer-events-none absolute bottom-16 left-24 h-1 w-16 rounded-full bg-amber-200"
                : weaponFamily === "magic"
                  ? "pointer-events-none absolute bottom-20 left-28 h-16 w-16 rounded-full bg-sky-400/40 blur-md"
                  : "pointer-events-none absolute bottom-14 left-20 h-14 w-3 rounded-full bg-amber-200/80"
            }
            initial={{ opacity: 0.2 }}
            animate={
              weaponFamily === "ranged"
                ? { x: strike.x, opacity: strike.opacity }
                : weaponFamily === "magic"
                  ? { scale: strike.scale, opacity: strike.opacity }
                  : { rotate: strike.rotate, x: strike.x }
            }
            transition={{ duration: 0.55, repeat: 5, repeatDelay: 0.35 }}
          />
        </AnimatePresence>
      </div>

      <div className="relative z-10 flex flex-col items-center gap-2">
        <span className="max-w-[12rem] truncate text-sm uppercase tracking-widest text-vb-muted">{monsterName}</span>
        <motion.div
          className="h-28 w-24 rounded-lg border border-red-500/35 bg-gradient-to-b from-red-950/70 to-vb-panel"
          initial={{ x: 0, opacity: 1 }}
          animate={{ x: [0, -6, 0], opacity: [1, 0.85, 0] }}
          transition={{ duration: 6, times: [0, 0.75, 1], ease: "easeInOut" }}
        />
      </div>
    </div>
  );
}
