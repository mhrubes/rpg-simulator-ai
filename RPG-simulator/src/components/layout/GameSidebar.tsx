"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useI18n } from "@/providers/I18nProvider";
import { useGameStore } from "@/stores/gameStore";
import { xpToNextLevel } from "@/lib/game/formulas";
import { useMemo, useState } from "react";

const links = [
  { href: "/player", key: "nav.player" },
  { href: "/tavern", key: "nav.tavern" },
  { href: "/patrol", key: "nav.patrol" },
  { href: "/arena", key: "nav.arena" },
  { href: "/blacksmith", key: "nav.blacksmith" },
  { href: "/mage", key: "nav.mage" },
  { href: "/stable", key: "nav.stable" },
  { href: "/underworld", key: "nav.underworld" },
  { href: "/guild", key: "nav.guild" },
  { href: "/mail", key: "nav.mail" },
  { href: "/hall", key: "nav.hall" },
  { href: "/settings", key: "nav.settings" },
] as const;

export function GameSidebar() {
  const pathname = usePathname();
  const { t } = useI18n();
  const game = useGameStore((s) => s.game);
  const logout = useGameStore((s) => s.logout);
  const [xpOpen, setXpOpen] = useState(false);

  const xpNeed = useMemo(() => (game ? xpToNextLevel(game.level) : 0), [game]);

  if (!game) return null;

  const pct = Math.min(100, Math.round((game.xp / Math.max(1, xpNeed)) * 100));

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-vb-border bg-vb-panel/90 backdrop-blur-md">
      <Link href="/player" className="border-b border-vb-border p-4 transition hover:bg-white/5">
        <div className="flex items-center gap-3">
          <div className="relative h-12 w-12 overflow-hidden rounded-lg border border-vb-border bg-gradient-to-br from-amber-900/40 to-vb-bg">
            <div className="flex h-full w-full items-center justify-center text-lg font-black text-amber-300">
              {game.nickname.slice(0, 1).toUpperCase()}
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-base font-semibold text-white">{game.nickname}</div>
            <div
              className="relative mt-1 h-2 overflow-hidden rounded-full bg-black/50"
              onMouseEnter={() => setXpOpen(true)}
              onMouseLeave={() => setXpOpen(false)}
            >
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-amber-600 to-amber-300"
                initial={false}
                animate={{ width: `${pct}%` }}
              />
            </div>
            <div className="mt-1 flex items-center justify-between text-xs text-vb-muted">
              <span>
                {t("common.level")} {game.level}
              </span>
            </div>
            {xpOpen && (
              <div className="mt-1 rounded-md border border-vb-border bg-black/70 px-2 py-1 text-xs text-amber-100">
                XP {game.xp} / {xpNeed}
              </div>
            )}
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between gap-2 text-sm">
          <span className="text-amber-200/90">
            {game.gold.toLocaleString()} {t("common.gold").toLowerCase()}
          </span>
          <span className="text-sky-300/90">
            {game.diamonds} {t("common.diamonds").toLowerCase()}
          </span>
        </div>
      </Link>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-2">
        {links.map((l) => {
          const active = pathname === l.href || (l.href !== "/player" && pathname.startsWith(l.href + "/"));
          return (
            <Link key={l.href} href={l.href}>
              <motion.div
                className={`rounded-lg px-3 py-2.5 text-base font-medium transition ${
                  active
                    ? "border border-amber-500/35 bg-amber-500/10 text-amber-100"
                    : "border border-transparent text-vb-muted hover:border-vb-border hover:bg-white/5 hover:text-white"
                }`}
                whileTap={{ scale: 0.98 }}
              >
                {t(l.key)}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-vb-border p-2">
        <button type="button" className="vb-btn w-full text-red-300" onClick={() => logout()}>
          {t("nav.logout")}
        </button>
      </div>
    </aside>
  );
}
