import { create } from "zustand";
import type { GameSaveV1 } from "@/lib/game/initialSave";
import { createInitialSave } from "@/lib/game/initialSave";
import type {
  EquipmentState,
  ExpeditionKind,
  GameItem,
  Guild,
  ItemKind,
  MailMessage,
} from "@/lib/game/types";
import {
  GUILD_BASE_MAX_MEMBERS,
  GUILD_CREATE_COST,
  OVERFLOW_DESTROY_MS,
  UNDERWORLD_FLOOR_COOLDOWN_MS,
} from "@/lib/game/types";
import { createExpedition, expeditionShouldEnterCombat, rollPostQuestDiamond, rollPostQuestItem } from "@/lib/game/expedition";
import {
  BLACKSMITH_REFRESH_DIAMOND_COST,
  rollBlacksmithOffers,
} from "@/lib/game/blacksmithShop";
import { generateShopArmorPiece, generateShopWeapon, generateTrinket, generateElixir } from "@/lib/game/items";
import { guildBonusPercent, guildUpgradeCost, patrolGoldPerHour, primaryStatForClass, xpToNextLevel } from "@/lib/game/formulas";
import { recomputeMaxVitality, totalStats } from "@/lib/game/stats";
import { writeSave, loadSave } from "@/lib/storage/save";
import { arenaCooldownRemainingMs, markArenaAttack } from "@/lib/storage/arena";
import {
  bumpUnderworldClears,
  getSessionUserId,
  listRegisteredUsers,
  registerUser,
  setSessionUserId,
  verifyLogin,
} from "@/lib/storage/registry";
import { getGuild, upsertGuild } from "@/lib/storage/guilds";
import { nanoid } from "nanoid";

type GameStore = {
  game: GameSaveV1 | null;
  ready: boolean;
  boot: () => void;
  logout: () => void;
  registerAndLogin: (nickname: string, password: string, playerClass: GameSaveV1["playerClass"]) => { ok: boolean; error?: string };
  login: (nickname: string, password: string) => { ok: boolean; error?: string };
  patch: (fn: (g: GameSaveV1) => GameSaveV1) => void;
  syncClock: () => void;
  /** taverna výprava */
  startExpedition: (kind: ExpeditionKind) => { ok: boolean; reason?: string };
  setExpeditionPhase: (phase: "travel" | "combat" | "done") => void;
  finishExpeditionRewards: () => void;
  sellPendingLoot: () => void;
  stashPendingToOverflow: () => void;
  /** hlídka */
  startPatrol: (hours: number) => { ok: boolean; reason?: string };
  cancelPatrol: () => void;
  /** inventář */
  swapInventory: (a: number, b: number) => void;
  equipFromInventory: (invIndex: number, equipKey: keyof EquipmentState) => { ok: boolean };
  unequipToInventory: (equipKey: keyof EquipmentState, invIndex: number) => { ok: boolean };
  useElixir: (invIndex: number) => { ok: boolean };
  destroyInventory: (invIndex: number) => void;
  setOverflowFromItem: (item: GameItem) => void;
  moveInventoryToOverflow: (invIndex: number) => { ok: boolean };
  /** obchod */
  buyWeapon: () => { ok: boolean };
  buyArmor: (kind: "armor" | "helmet" | "boots" | "gloves") => { ok: boolean };
  refreshBlacksmithOffers: () => { ok: boolean };
  buyRing: (stat: "str" | "dex" | "int" | "vit") => { ok: boolean };
  buyAmulet: (stat: "str" | "dex" | "int" | "vit") => { ok: boolean };
  buyElixir: (stat: "str" | "dex" | "int" | "vit") => { ok: boolean };
  buyStableAnimal: (id: string, price: number) => { ok: boolean };
  /** podsvětí */
  attemptUnderworldFloor: (floor: number) => { ok: boolean; reason?: string };
  completeUnderworldFloor: (floor: number, success: boolean, loot?: GameItem | null) => void;
  /** aréna */
  arenaAttack: (defenderId: string) => { ok: boolean; reason?: string; win?: boolean; protectedHonor?: boolean };
  /** cech */
  createGuild: (name: string) => { ok: boolean; reason?: string };
  donateGuildTreasury: (gold: number, diamonds: number) => { ok: boolean };
  upgradeGuildBonus: (id: "tavern_gold" | "tavern_xp") => { ok: boolean; reason?: string };
  inviteToGuild: (targetNickname: string) => { ok: boolean; reason?: string };
  respondMail: (mailId: string, accept: boolean) => void;
  increaseGuildCapWithDiamond: () => { ok: boolean; reason?: string };
};

function persist(g: GameSaveV1) {
  writeSave(g);
}

function firstEmptyInv(inv: (GameItem | null)[]) {
  return inv.findIndex((x) => x === null);
}

function kindAllowedInSlot(kind: ItemKind, slot: keyof EquipmentState): boolean {
  if (slot === "weapon") return kind === "weapon";
  if (slot === "armor") return kind === "armor";
  if (slot === "helmet") return kind === "helmet";
  if (slot === "boots") return kind === "boots";
  if (slot === "gloves") return kind === "gloves";
  if (slot === "amulet") return kind === "amulet";
  if (slot === "ring1" || slot === "ring2") return kind === "ring";
  return false;
}

function applyGuildTavernBonuses(save: GameSaveV1, gold: number, xp: number) {
  if (!save.guildId) return { gold, xp };
  const g = getGuild(save.guildId);
  if (!g) return { gold, xp };
  const goldPct = guildBonusPercent(g.upgrades.tavern_gold ?? 0);
  const xpPct = guildBonusPercent(g.upgrades.tavern_xp ?? 0);
  return {
    gold: Math.round(gold * (1 + goldPct / 100)),
    xp: Math.round(xp * (1 + xpPct / 100)),
  };
}

function addXp(save: GameSaveV1, xpGain: number): GameSaveV1 {
  let g = { ...save, xp: save.xp + xpGain };
  while (g.xp >= xpToNextLevel(g.level)) {
    g.xp -= xpToNextLevel(g.level);
    g.level += 1;
  }
  const maxVit = recomputeMaxVitality(g);
  g.maxVitality = maxVit;
  g.vitality = Math.min(maxVit, g.vitality + 2);
  return g;
}

function patrolActive(save: GameSaveV1) {
  return save.patrol !== null && Date.now() < save.patrol.endsAt;
}

function syncWorld(save: GameSaveV1): GameSaveV1 {
  const g = structuredClone(save);
  if (g.patrol && Date.now() >= g.patrol.endsAt) {
    g.gold += g.patrol.goldReward;
    g.patrol = null;
  }
  if (g.overflow.expiresAt && Date.now() >= g.overflow.expiresAt) {
    g.overflow = { item: null, expiresAt: null };
  }
  if (g.expedition && g.expedition.phase === "travel") {
    const ex = g.expedition;
    if (ex.startedAt == null || !Number.isFinite(ex.startedAt)) {
      const d = ex.durationMs && ex.durationMs > 0 ? ex.durationMs : Math.max(8000, ex.endsAt - Date.now());
      g.expedition = { ...ex, startedAt: ex.endsAt - d };
    }
  }
  if (g.expedition && expeditionShouldEnterCombat(g.expedition)) {
    g.expedition = { ...g.expedition, phase: "combat" };
  }
  if (!g.blacksmithOffers) {
    g.blacksmithOffers = rollBlacksmithOffers(g.level, g.playerClass);
  }
  const now = Date.now();
  g.activeBuffs = g.activeBuffs.filter((b) => b.expiresAt > now);
  g.trinketCharges = g.trinketCharges.filter((t) => t.expiresAt > now);
  return g;
}

export const useGameStore = create<GameStore>((set, get) => ({
  game: null,
  ready: false,

  boot: () => {
    if (typeof window === "undefined") return;
    const id = getSessionUserId();
    if (!id) {
      set({ game: null, ready: true });
      return;
    }
    const loaded = loadSave(id);
    if (!loaded) {
      set({ game: null, ready: true });
      return;
    }
    set({ game: syncWorld(loaded), ready: true });
  },

  logout: () => {
    setSessionUserId(null);
    set({ game: null, ready: true });
  },

  registerAndLogin: (nickname, password, playerClass) => {
    const res = registerUser({ nickname, password, playerClass });
    if (!res.ok) return { ok: false, error: "duplicate" };
    const save = createInitialSave(res.user.id, nickname.trim(), playerClass);
    persist(save);
    setSessionUserId(res.user.id);
    set({ game: save, ready: true });
    return { ok: true };
  },

  login: (nickname, password) => {
    const u = verifyLogin(nickname, password);
    if (!u) return { ok: false, error: "bad_credentials" };
    const save = loadSave(u.id);
    if (!save) return { ok: false, error: "missing_save" };
    setSessionUserId(u.id);
    set({ game: syncWorld(save), ready: true });
    return { ok: true };
  },

  patch: (fn) => {
    const g0 = get().game;
    if (!g0) return;
    let next = fn(structuredClone(syncWorld(g0)));
    next = syncWorld(next);
    persist(next);
    set({ game: next });
  },

  syncClock: () => {
    const g0 = get().game;
    if (!g0) return;
    const next = syncWorld(structuredClone(g0));
    if (JSON.stringify(next) !== JSON.stringify(g0)) {
      persist(next);
      set({ game: next });
    }
  },

  startExpedition: (kind) => {
    const g0 = get().game;
    if (!g0) return { ok: false, reason: "no_game" };
    if (patrolActive(g0)) return { ok: false, reason: "patrol" };
    if (g0.expedition) return { ok: false, reason: "busy" };
    get().patch((s) => ({
      ...s,
      expedition: createExpedition(s.level, kind, s.ownedAnimals),
    }));
    return { ok: true };
  },

  setExpeditionPhase: (phase) => {
    get().patch((s) => {
      if (!s.expedition) return s;
      return { ...s, expedition: { ...s.expedition, phase } };
    });
  },

  finishExpeditionRewards: () => {
    get().patch((s) => {
      if (!s.expedition || s.expedition.phase === "travel") return s;
      const ex = s.expedition;
      let gold = ex.goldReward;
      let xp = ex.xpReward;
      ({ gold, xp } = applyGuildTavernBonuses(s, gold, xp));
      let next = { ...s, gold: s.gold + gold };
      next = addXp(next, xp);
      if (rollPostQuestDiamond()) next.diamonds += 1;
      let drop: GameItem | null = null;
      if (rollPostQuestItem()) {
        drop = generateShopWeapon(s.level, s.playerClass);
      }
      const idx = firstEmptyInv(next.inventory);
      if (drop) {
        if (idx === -1) next = { ...next, pendingTavernLoot: drop };
        else {
          const inv = [...next.inventory];
          inv[idx] = drop;
          next = { ...next, inventory: inv };
        }
      }
      next.expedition = null;
      return next;
    });
  },

  sellPendingLoot: () => {
    get().patch((s) => {
      if (!s.pendingTavernLoot) return s;
      const price = Math.max(5, Math.floor(s.pendingTavernLoot.priceGold * 0.55));
      return {
        ...s,
        gold: s.gold + price,
        pendingTavernLoot: null,
      };
    });
  },

  stashPendingToOverflow: () => {
    get().patch((s) => {
      if (!s.pendingTavernLoot) return s;
      return {
        ...s,
        overflow: { item: s.pendingTavernLoot, expiresAt: Date.now() + OVERFLOW_DESTROY_MS },
        pendingTavernLoot: null,
      };
    });
  },

  startPatrol: (hours) => {
    const g0 = get().game;
    if (!g0) return { ok: false, reason: "no_game" };
    if (g0.expedition) return { ok: false, reason: "expedition" };
    if (patrolActive(g0)) return { ok: false, reason: "already" };
    const h = Math.min(10, Math.max(1, Math.floor(hours)));
    const reward = patrolGoldPerHour(g0.level) * h;
    get().patch((s) => ({
      ...s,
      patrol: { hours: h, endsAt: Date.now() + h * 60 * 60 * 1000, goldReward: reward },
    }));
    return { ok: true };
  },

  cancelPatrol: () => {
    get().patch((s) => {
      if (!s.patrol) return s;
      if (Date.now() >= s.patrol.endsAt) return s;
      return { ...s, patrol: null };
    });
  },

  swapInventory: (a, b) => {
    get().patch((s) => {
      const inv = [...s.inventory];
      const tmp = inv[a]!;
      inv[a] = inv[b]!;
      inv[b] = tmp;
      return { ...s, inventory: inv };
    });
  },

  equipFromInventory: (invIndex, equipKey) => {
    let ok = false;
    get().patch((s) => {
      const item = s.inventory[invIndex];
      if (!item) return s;
      if (!kindAllowedInSlot(item.kind, equipKey)) return s;
      if (item.levelReq > s.level) return s;
      const current = s.equipment[equipKey];
      const inv = [...s.inventory];
      inv[invIndex] = current;
      const eq = { ...s.equipment, [equipKey]: item } as EquipmentState;
      ok = true;
      let trinketCharges = s.trinketCharges;
      if ((item.kind === "ring" || item.kind === "amulet") && item.trinketDurationMs) {
        trinketCharges = [
          ...trinketCharges.filter((t) => t.itemId !== item.id),
          { itemId: item.id, expiresAt: Date.now() + item.trinketDurationMs },
        ];
      }
      let next: GameSaveV1 = { ...s, equipment: eq, inventory: inv, trinketCharges };
      next.maxVitality = recomputeMaxVitality(next);
      next.vitality = Math.min(next.vitality, next.maxVitality);
      return next;
    });
    return { ok };
  },

  unequipToInventory: (equipKey, invIndex) => {
    let ok = false;
    get().patch((s) => {
      const item = s.equipment[equipKey];
      if (!item) return s;
      if (s.inventory[invIndex]) return s;
      const inv = [...s.inventory];
      inv[invIndex] = item;
      const eq = { ...s.equipment, [equipKey]: null } as EquipmentState;
      ok = true;
      let next: GameSaveV1 = { ...s, equipment: eq, inventory: inv };
      next.maxVitality = recomputeMaxVitality(next);
      next.vitality = Math.min(next.vitality, next.maxVitality);
      return next;
    });
    return { ok };
  },

  useElixir: (invIndex) => {
    let ok = false;
    get().patch((s) => {
      const item = s.inventory[invIndex];
      if (!item || item.kind !== "elixir" || !item.elixirStat || !item.elixirDurationMs) return s;
      const inv = [...s.inventory];
      inv[invIndex] = null;
      const stat = item.elixirStat;
      const value = 3 + Math.floor(s.level / 2);
      const buff = {
        id: nanoid(),
        stat,
        value,
        expiresAt: Date.now() + item.elixirDurationMs,
      };
      ok = true;
      let next: GameSaveV1 = {
        ...s,
        inventory: inv,
        activeBuffs: [...s.activeBuffs, buff],
      };
      next.maxVitality = recomputeMaxVitality(next);
      return next;
    });
    return { ok };
  },

  destroyInventory: (invIndex) => {
    get().patch((s) => {
      const inv = [...s.inventory];
      inv[invIndex] = null;
      return { ...s, inventory: inv };
    });
  },

  setOverflowFromItem: (item) => {
    get().patch((s) => ({
      ...s,
      overflow: { item, expiresAt: Date.now() + OVERFLOW_DESTROY_MS },
    }));
  },

  moveInventoryToOverflow: (invIndex) => {
    let ok = false;
    get().patch((s) => {
      const item = s.inventory[invIndex];
      if (!item || s.overflow.item) return s;
      const inv = [...s.inventory];
      inv[invIndex] = null;
      ok = true;
      return {
        ...s,
        inventory: inv,
        overflow: { item, expiresAt: Date.now() + OVERFLOW_DESTROY_MS },
      };
    });
    return { ok };
  },

  buyWeapon: () => {
    let ok = false;
    get().patch((s) => {
      const offers = s.blacksmithOffers;
      if (!offers) return s;
      const it = offers.weapon;
      if (s.gold < it.priceGold) return s;
      const idx = firstEmptyInv(s.inventory);
      if (idx === -1) return s;
      ok = true;
      const inv = [...s.inventory];
      inv[idx] = it;
      return {
        ...s,
        gold: s.gold - it.priceGold,
        inventory: inv,
        blacksmithOffers: { ...offers, weapon: generateShopWeapon(s.level, s.playerClass) },
      };
    });
    return { ok };
  },

  buyArmor: (kind) => {
    let ok = false;
    get().patch((s) => {
      const offers = s.blacksmithOffers;
      if (!offers) return s;
      const it = offers[kind];
      if (s.gold < it.priceGold) return s;
      const idx = firstEmptyInv(s.inventory);
      if (idx === -1) return s;
      ok = true;
      const inv = [...s.inventory];
      inv[idx] = it;
      return {
        ...s,
        gold: s.gold - it.priceGold,
        inventory: inv,
        blacksmithOffers: {
          ...offers,
          [kind]: generateShopArmorPiece(s.level, s.playerClass, kind),
        },
      };
    });
    return { ok };
  },

  refreshBlacksmithOffers: () => {
    let ok = false;
    get().patch((s) => {
      if (s.diamonds < BLACKSMITH_REFRESH_DIAMOND_COST) return s;
      ok = true;
      return {
        ...s,
        diamonds: s.diamonds - BLACKSMITH_REFRESH_DIAMOND_COST,
        blacksmithOffers: rollBlacksmithOffers(s.level, s.playerClass),
      };
    });
    return { ok };
  },

  buyRing: (stat) => {
    let ok = false;
    get().patch((s) => {
      const it = generateTrinket(s.level, "ring", stat);
      if (s.gold < it.priceGold) return s;
      const idx = firstEmptyInv(s.inventory);
      if (idx === -1) return s;
      ok = true;
      const inv = [...s.inventory];
      inv[idx] = it;
      return { ...s, gold: s.gold - it.priceGold, inventory: inv };
    });
    return { ok };
  },

  buyAmulet: (stat) => {
    let ok = false;
    get().patch((s) => {
      const it = generateTrinket(s.level, "amulet", stat);
      if (s.gold < it.priceGold) return s;
      const idx = firstEmptyInv(s.inventory);
      if (idx === -1) return s;
      ok = true;
      const inv = [...s.inventory];
      inv[idx] = it;
      return { ...s, gold: s.gold - it.priceGold, inventory: inv };
    });
    return { ok };
  },

  buyElixir: (stat) => {
    let ok = false;
    get().patch((s) => {
      const it = generateElixir(s.level, stat);
      if (s.gold < it.priceGold) return s;
      const idx = firstEmptyInv(s.inventory);
      if (idx === -1) return s;
      ok = true;
      const inv = [...s.inventory];
      inv[idx] = it;
      return { ...s, gold: s.gold - it.priceGold, inventory: inv };
    });
    return { ok };
  },

  buyStableAnimal: (id, price) => {
    let ok = false;
    get().patch((s) => {
      if (s.ownedAnimals.includes(id)) return s;
      if (s.gold < price) return s;
      ok = true;
      return { ...s, gold: s.gold - price, ownedAnimals: [...s.ownedAnimals, id] };
    });
    return { ok };
  },

  attemptUnderworldFloor: (floor) => {
    const g0 = get().game;
    if (!g0) return { ok: false, reason: "no_game" };
    if (patrolActive(g0)) return { ok: false, reason: "patrol" };
    if (g0.expedition) return { ok: false, reason: "expedition" };
    if (g0.underworld.completedFloors.includes(floor)) return { ok: false, reason: "done" };
    const last = g0.underworld.lastAttemptByFloor[floor] ?? 0;
    if (Date.now() - last < UNDERWORLD_FLOOR_COOLDOWN_MS) return { ok: false, reason: "cooldown" };
    return { ok: true };
  },

  completeUnderworldFloor: (floor, success, loot) => {
    get().patch((s) => {
      const uw = { ...s.underworld, lastAttemptByFloor: { ...s.underworld.lastAttemptByFloor, [floor]: Date.now() } };
      if (!success) return { ...s, underworld: uw };
      const completed = Array.from(new Set([...s.underworld.completedFloors, floor])).sort((a, b) => a - b);
      let next: GameSaveV1 = {
        ...s,
        underworld: { ...uw, completedFloors: completed },
        gold: s.gold + 30 + floor * 14,
      };
      next = addXp(next, 20 + floor * 10);
      if (loot) {
        const idx = firstEmptyInv(next.inventory);
        if (idx === -1) next = { ...next, pendingTavernLoot: loot };
        else {
          const inv = [...next.inventory];
          inv[idx] = loot;
          next = { ...next, inventory: inv };
        }
      }
      bumpUnderworldClears(s.userId, 1);
      return next;
    });
  },

  arenaAttack: (defenderId) => {
    const s = get().game;
    if (!s) return { ok: false, reason: "no_game" };
    if (patrolActive(s)) return { ok: false, reason: "patrol" };
    if (arenaCooldownRemainingMs(s.userId) > 0) return { ok: false, reason: "cd" };
    const defSave = loadSave(defenderId);
    if (!defSave) return { ok: false, reason: "no_def" };
    if (defenderId === s.userId) return { ok: false, reason: "self" };
    const atk = totalStats(s);
    const def = totalStats(defSave);
    const primary = primaryStatForClass(s.playerClass);
    const atkScore = atk.str + atk.dex + atk.int + atk.vit + (atk[primary] ?? 0) * 1.4 + s.level * 1.2;
    const defPrimary = primaryStatForClass(defSave.playerClass);
    const defScore = def.str + def.dex + def.int + def.vit + (def[defPrimary] ?? 0) * 1.4 + defSave.level * 1.2;
    const win = atkScore + Math.random() * 26 > defScore + Math.random() * 26;
    markArenaAttack(s.userId);
    if (!win && defSave.level > s.level + 12) {
      return { ok: true, win: false, protectedHonor: true };
    }
    const attackerDelta = win ? 5 : -3;
    const defenderDelta = win ? -3 : 2;
    get().patch((g) => ({
      ...g,
      honor: Math.max(0, Math.min(250, g.honor + attackerDelta)),
    }));
    const defNext = {
      ...defSave,
      honor: Math.max(0, Math.min(250, defSave.honor + defenderDelta)),
    };
    persist(defNext);
    return { ok: true, win };
  },

  createGuild: (name) => {
    let ok = false;
    get().patch((s) => {
      if (s.guildId) return s;
      if (s.gold < GUILD_CREATE_COST) return s;
      const trimmed = name.trim();
      if (trimmed.length < 3) return s;
      const guild: Guild = {
        id: nanoid(),
        name: trimmed,
        ownerId: s.userId,
        members: [{ userId: s.userId, nickname: s.nickname, role: "owner", donatedGold: 0, donatedDiamonds: 0 }],
        maxMembers: GUILD_BASE_MAX_MEMBERS,
        treasuryGold: 0,
        treasuryDiamonds: 0,
        upgrades: { tavern_gold: 0, tavern_xp: 0 },
      };
      upsertGuild(guild);
      ok = true;
      return { ...s, gold: s.gold - GUILD_CREATE_COST, guildId: guild.id };
    });
    return { ok };
  },

  donateGuildTreasury: (gold, diamonds) => {
    let ok = false;
    get().patch((s) => {
      if (!s.guildId) return s;
      const g = getGuild(s.guildId);
      if (!g) return s;
      const member = g.members.find((m) => m.userId === s.userId);
      if (!member) return s;
      if (s.gold < gold || s.diamonds < diamonds) return s;
      const guild: Guild = {
        ...g,
        treasuryGold: g.treasuryGold + gold,
        treasuryDiamonds: g.treasuryDiamonds + diamonds,
        members: g.members.map((m) =>
          m.userId === s.userId
            ? { ...m, donatedGold: m.donatedGold + gold, donatedDiamonds: m.donatedDiamonds + diamonds }
            : m,
        ),
      };
      upsertGuild(guild);
      ok = true;
      return { ...s, gold: s.gold - gold, diamonds: s.diamonds - diamonds };
    });
    return { ok };
  },

  upgradeGuildBonus: (id) => {
    let ok = false;
    get().patch((s) => {
      if (!s.guildId) return s;
      const g = getGuild(s.guildId);
      if (!g || g.ownerId !== s.userId) return s;
      const level = (g.upgrades[id] ?? 0) + 1;
      const cost = guildUpgradeCost(id, level);
      if (g.treasuryGold < cost) return s;
      const guild: Guild = {
        ...g,
        treasuryGold: g.treasuryGold - cost,
        upgrades: { ...g.upgrades, [id]: level },
      };
      upsertGuild(guild);
      ok = true;
      return s;
    });
    return { ok };
  },

  inviteToGuild: (targetNickname) => {
    const s = get().game;
    if (!s?.guildId) return { ok: false, reason: "no_guild" };
    const g = getGuild(s.guildId);
    if (!g || g.ownerId !== s.userId) return { ok: false, reason: "forbidden" };
    const target = listRegisteredUsers().find((u) => u.nickname.toLowerCase() === targetNickname.trim().toLowerCase());
    if (!target) return { ok: false, reason: "missing" };
    if (g.members.length >= g.maxMembers) return { ok: false, reason: "full" };
    const mail: MailMessage = {
      id: nanoid(),
      type: "guild_invite",
      title: "Pozvánka do cechu",
      body: `${s.nickname} tě zve do cechu „${g.name}“.`,
      fromNickname: s.nickname,
      guildId: g.id,
      guildName: g.name,
      createdAt: Date.now(),
    };
    const tSave = loadSave(target.id);
    if (!tSave) return { ok: false, reason: "missing_save" };
    tSave.mail = [mail, ...tSave.mail];
    persist(tSave);
    return { ok: true };
  },

  respondMail: (mailId, accept) => {
    get().patch((s) => {
      const mail = s.mail.find((m) => m.id === mailId);
      if (!mail) return s;
      const rest = s.mail.filter((m) => m.id !== mailId);
      if (!accept || mail.type !== "guild_invite") return { ...s, mail: rest };
      const g = getGuild(mail.guildId);
      if (!g || g.members.length >= g.maxMembers) return { ...s, mail: rest };
      const guild: Guild = {
        ...g,
        members: [...g.members, { userId: s.userId, nickname: s.nickname, role: "member", donatedGold: 0, donatedDiamonds: 0 }],
      };
      upsertGuild(guild);
      return { ...s, mail: rest, guildId: guild.id };
    });
  },

  increaseGuildCapWithDiamond: () => {
    let ok = false;
    get().patch((s) => {
      if (!s.guildId) return s;
      const g = getGuild(s.guildId);
      if (!g || g.ownerId !== s.userId) return s;
      const cost = 2;
      if (g.treasuryDiamonds < cost) return s;
      const guild: Guild = {
        ...g,
        maxMembers: g.maxMembers + 1,
        treasuryDiamonds: g.treasuryDiamonds - cost,
      };
      upsertGuild(guild);
      ok = true;
      return s;
    });
    return { ok };
  },
}));
