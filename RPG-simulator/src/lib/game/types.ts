export type PlayerClass = "knight" | "archer" | "mage";

export type ItemSlot =
  | "weapon"
  | "armor"
  | "helmet"
  | "boots"
  | "gloves"
  | "amulet"
  | "ring";

export type WeaponFamily = "melee" | "ranged" | "magic";

export type ItemKind = "weapon" | "armor" | "helmet" | "boots" | "gloves" | "amulet" | "ring" | "elixir";

export type StatKey = "str" | "dex" | "int" | "vit";

export type GameItem = {
  id: string;
  name: string;
  nameKey?: string;
  kind: ItemKind;
  weaponFamily?: WeaponFamily;
  levelReq: number;
  stats: Partial<Record<StatKey, number>>;
  /** zlatá cena v obchodě */
  priceGold: number;
  unique?: boolean;
  /** elixír: typ buffu */
  elixirStat?: StatKey;
  /** elixír: délka účinku v ms po aktivaci */
  elixirDurationMs?: number;
  /** prsten/amulet: doba platnosti od aktivace */
  trinketDurationMs?: number;
};

export type EquipmentState = {
  weapon: GameItem | null;
  armor: GameItem | null;
  helmet: GameItem | null;
  boots: GameItem | null;
  gloves: GameItem | null;
  amulet: GameItem | null;
  ring1: GameItem | null;
  ring2: GameItem | null;
};

export type ActiveBuff = {
  id: string;
  stat: StatKey;
  value: number;
  expiresAt: number;
};

export type TrinketCharge = {
  itemId: string;
  expiresAt: number;
};

export type ExpeditionKind = "gold" | "xp" | "balanced";

export type ExpeditionState = {
  kind: ExpeditionKind;
  endsAt: number;
  /** začátek výpravy (pro plynulý progress bar); u starých uložených her doplní sync */
  startedAt?: number;
  /** celková plánovaná délka cesty v ms (pro progress bar) */
  durationMs: number;
  goldReward: number;
  xpReward: number;
  monsterName: string;
  monsterLevel: number;
};

export type ExpeditionRuntime = ExpeditionState & {
  phase: "travel" | "combat" | "done";
};

export type PatrolState = {
  hours: number;
  endsAt: number;
  goldReward: number;
};

export type MailType = "guild_invite";

export type MailMessage = {
  id: string;
  type: MailType;
  title: string;
  body: string;
  fromNickname: string;
  guildId: string;
  guildName: string;
  createdAt: number;
};

export type GuildUpgradeId = "tavern_gold" | "tavern_xp";

export type GuildMember = {
  userId: string;
  nickname: string;
  role: "owner" | "member";
  donatedGold: number;
  donatedDiamonds: number;
};

export type Guild = {
  id: string;
  name: string;
  ownerId: string;
  members: GuildMember[];
  maxMembers: number;
  treasuryGold: number;
  treasuryDiamonds: number;
  upgrades: Record<GuildUpgradeId, number>;
};

export type UnderworldProgress = {
  completedFloors: number[];
  lastAttemptByFloor: Record<number, number>;
};

export type StableAnimal = {
  id: string;
  nameKey: string;
  priceGold: number;
  timeReductionPercent: number;
};

export const STABLE_ANIMALS: StableAnimal[] = [
  { id: "pony", nameKey: "stable.pony", priceGold: 80, timeReductionPercent: 5 },
  { id: "wolf", nameKey: "stable.wolf", priceGold: 220, timeReductionPercent: 10 },
  { id: "griffon", nameKey: "stable.griffon", priceGold: 600, timeReductionPercent: 18 },
  { id: "drake", nameKey: "stable.drake", priceGold: 1400, timeReductionPercent: 28 },
];

export const GUILD_CREATE_COST = 100;
export const GUILD_BASE_MAX_MEMBERS = 10;
export const OVERFLOW_DESTROY_MS = 10 * 60 * 1000;
export const ARENA_COOLDOWN_MS = 10 * 60 * 1000;
export const UNDERWORLD_FLOOR_COOLDOWN_MS = 60 * 60 * 1000;
