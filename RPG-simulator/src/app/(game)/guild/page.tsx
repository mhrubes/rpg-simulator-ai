"use client";

import { useState } from "react";
import { useI18n } from "@/providers/I18nProvider";
import { useGameStore } from "@/stores/gameStore";
import { getGuild } from "@/lib/storage/guilds";
import { guildBonusPercent, guildUpgradeCost } from "@/lib/game/formulas";

export default function GuildPage() {
  const { t } = useI18n();
  const game = useGameStore((s) => s.game)!;
  const createGuild = useGameStore((s) => s.createGuild);
  const donate = useGameStore((s) => s.donateGuildTreasury);
  const upgrade = useGameStore((s) => s.upgradeGuildBonus);
  const invite = useGameStore((s) => s.inviteToGuild);
  const capUp = useGameStore((s) => s.increaseGuildCapWithDiamond);

  const [name, setName] = useState("");
  const [nick, setNick] = useState("");
  const [gGold, setGGold] = useState(10);
  const [gDia, setGDia] = useState(0);

  const guild = game.guildId ? getGuild(game.guildId) : undefined;
  const isOwner = guild && guild.ownerId === game.userId;

  const nextGoldLvl = (guild?.upgrades.tavern_gold ?? 0) + 1;
  const nextXpLvl = (guild?.upgrades.tavern_xp ?? 0) + 1;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-white">{t("guild.title")}</h1>
      </header>

      {!guild && (
        <div className="vb-card max-w-md space-y-3 p-5">
          <label className="text-base text-vb-muted">{t("guild.name")}</label>
          <input className="vb-input" value={name} onChange={(e) => setName(e.target.value)} />
          <button type="button" className="vb-btn vb-btn-primary" onClick={() => createGuild(name)}>
            {t("guild.create")}
          </button>
        </div>
      )}

      {guild && (
        <div className="space-y-4">
          <div className="vb-card p-5">
            <h2 className="text-xl font-bold text-white">{guild.name}</h2>
            <p className="text-base text-vb-muted">
              Členové: {guild.members.length}/{guild.maxMembers}
            </p>
            <p className="mt-2 text-base text-amber-200">
              Pokladna: {guild.treasuryGold} zlata, {guild.treasuryDiamonds} diamantů
            </p>
            <p className="mt-2 text-sm text-vb-muted">
              Bonus výprav: zlato +{guildBonusPercent(guild.upgrades.tavern_gold ?? 0).toFixed(1)}%, XP +
              {guildBonusPercent(guild.upgrades.tavern_xp ?? 0).toFixed(1)}%
            </p>
          </div>

          <div className="vb-card flex flex-wrap items-end gap-3 p-4">
            <div>
              <label className="text-sm text-vb-muted">Zlato</label>
              <input type="number" className="vb-input w-28" value={gGold} onChange={(e) => setGGold(Number(e.target.value))} />
            </div>
            <div>
              <label className="text-sm text-vb-muted">Diamanty</label>
              <input type="number" className="vb-input w-28" value={gDia} onChange={(e) => setGDia(Number(e.target.value))} />
            </div>
            <button type="button" className="vb-btn vb-btn-primary" onClick={() => donate(gGold, gDia)}>
              {t("guild.donate")}
            </button>
          </div>

          {isOwner && (
            <div className="vb-card space-y-3 p-4">
              <h3 className="text-base font-semibold text-amber-200/90">Vylepšení (jen zakladatel)</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="vb-btn"
                  onClick={() => upgrade("tavern_gold")}
                >
                  {t("guild.upgradeGold")} ({guildUpgradeCost("tavern_gold", nextGoldLvl)} z pokladny)
                </button>
                <button type="button" className="vb-btn" onClick={() => upgrade("tavern_xp")}>
                  {t("guild.upgradeXp")} ({guildUpgradeCost("tavern_xp", nextXpLvl)} z pokladny)
                </button>
                <button type="button" className="vb-btn" onClick={() => capUp()}>
                  {t("guild.cap")}
                </button>
              </div>
              <div className="flex gap-2">
                <input className="vb-input max-w-xs" placeholder="přezdívka" value={nick} onChange={(e) => setNick(e.target.value)} />
                <button type="button" className="vb-btn" onClick={() => invite(nick)}>
                  {t("guild.invite")}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
