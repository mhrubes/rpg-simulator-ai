"use client";

import type { AppLocale } from "@/i18n/messages";
import type { GameItem, PlayerClass } from "@/lib/game/types";
import { getItemComparisonLines } from "@/lib/game/itemCompare";

type Props = {
  candidate: GameItem;
  equipped: GameItem | null;
  locale: AppLocale;
  playerClass: PlayerClass;
  enabled: boolean;
  className?: string;
};

export function ItemStatCompare({ candidate, equipped, locale, playerClass, enabled, className }: Props) {
  if (!enabled || !equipped) return null;
  const lines = getItemComparisonLines(candidate, equipped, locale, playerClass);
  if (lines.length === 0) return null;

  return (
    <div className={`flex flex-col gap-0.5 border-t border-white/10 pt-1.5 text-xs font-semibold ${className ?? ""}`}>
      {lines.map((line) => (
        <span
          key={line.text}
          className={
            line.better ? "text-emerald-300" : line.worse ? "text-red-300/95" : "text-vb-muted"
          }
        >
          {line.text}
        </span>
      ))}
    </div>
  );
}
