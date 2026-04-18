"use client";

import { useMemo, useState } from "react";
import { useI18n } from "@/providers/I18nProvider";
import { useGameStore } from "@/stores/gameStore";
import { listRegisteredUsers } from "@/lib/storage/registry";
import { loadSave } from "@/lib/storage/save";
import { arenaCooldownRemainingMs } from "@/lib/storage/arena";
import { CombatStage } from "@/components/combat/CombatStage";

export default function ArenaPage() {
  const { t } = useI18n();
  const game = useGameStore((s) => s.game)!;
  const arenaAttack = useGameStore((s) => s.arenaAttack);
  const [msg, setMsg] = useState<string | null>(null);
  const [fight, setFight] = useState<{ id: string; name: string } | null>(null);

  const patrolLock = game.patrol !== null && Date.now() < game.patrol.endsAt;
  const cd = arenaCooldownRemainingMs(game.userId);

  const rows = useMemo(() => {
    return listRegisteredUsers()
      .filter((u) => u.id !== game.userId)
      .map((u) => {
        const s = loadSave(u.id);
        return {
          id: u.id,
          nickname: u.nickname,
          level: s?.level ?? 1,
          honor: s?.honor ?? 100,
        };
      });
  }, [game.userId]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-white">{t("arena.title")}</h1>
        <p className="text-base text-vb-muted">
          {t("arena.cooldown")}: {Math.ceil(cd / 1000)}s
        </p>
      </header>

      {fight && (
        <div className="vb-card p-4">
          <CombatStage
            weaponFamily={game.equipment.weapon?.weaponFamily}
            monsterName={fight.name}
            onDone={() => {
              const res = arenaAttack(fight.id);
              if (!res.ok) setMsg(String(res.reason));
              else {
                setMsg(
                  res.protectedHonor ? t("arena.protected") : res.win ? t("arena.win") : t("arena.lose"),
                );
              }
              setFight(null);
            }}
          />
        </div>
      )}

      {msg && <p className="text-base text-amber-200">{msg}</p>}

      <div className="vb-card overflow-hidden">
        <table className="w-full text-left text-base">
          <thead className="border-b border-vb-border bg-black/30 text-sm uppercase text-vb-muted">
            <tr>
              <th className="px-4 py-2">Hráč</th>
              <th className="px-4 py-2">{t("common.level")}</th>
              <th className="px-4 py-2">{t("common.honor")}</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-vb-border/60">
                <td className="px-4 py-3 font-medium text-white">{r.nickname}</td>
                <td className="px-4 py-3 text-vb-muted">{r.level}</td>
                <td className="px-4 py-3 text-vb-muted">{r.honor}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    className="vb-btn vb-btn-primary"
                    disabled={patrolLock || cd > 0 || !!game.expedition || !!fight}
                    onClick={() => setFight({ id: r.id, name: r.nickname })}
                  >
                    {t("arena.attack")}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="p-4 text-base text-vb-muted">Zatím žádní jiní hráči v tomto prohlížeči.</p>}
      </div>
    </div>
  );
}
