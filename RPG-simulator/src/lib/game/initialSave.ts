import type { EquipmentState, GameItem, PlayerClass } from "./types";
import { rollBlacksmithOffers } from "./blacksmithShop";
import { generateShopWeapon, generateShopArmorPiece, generateElixir } from "./items";
import { baseStatsForClass } from "./formulas";

export type GameSaveV1 = {
  version: 1;
  userId: string;
  nickname: string;
  playerClass: PlayerClass;
  level: number;
  xp: number;
  gold: number;
  diamonds: number;
  honor: number;
  baseStats: ReturnType<typeof baseStatsForClass>;
  vitality: number;
  maxVitality: number;
  equipment: EquipmentState;
  inventory: (GameItem | null)[];
  overflow: { item: GameItem | null; expiresAt: number | null };
  ownedAnimals: string[];
  expedition: import("./types").ExpeditionRuntime | null;
  patrol: import("./types").PatrolState | null;
  activeBuffs: import("./types").ActiveBuff[];
  trinketCharges: import("./types").TrinketCharge[];
  mail: import("./types").MailMessage[];
  guildId: string | null;
  underworld: import("./types").UnderworldProgress;
  tavernNpcIndex: number;
  /** inventář plný – nabídka prodeje / přesun na přetékací slot */
  pendingTavernLoot: GameItem | null;
  /** náhled zboží u kováře */
  blacksmithOffers: import("./blacksmithShop").BlacksmithOffers;
};

export function createInitialSave(
  userId: string,
  nickname: string,
  playerClass: PlayerClass,
): GameSaveV1 {
  const baseStats = baseStatsForClass(playerClass);
  const starterWeapon = generateShopWeapon(1, playerClass);
  const starterArmor = generateShopArmorPiece(1, playerClass, "armor");
  const potion = generateElixir(1, "vit");
  const equipment: EquipmentState = {
    weapon: starterWeapon,
    armor: starterArmor,
    helmet: null,
    boots: null,
    gloves: null,
    amulet: null,
    ring1: null,
    ring2: null,
  };
  const inventory: (GameItem | null)[] = Array.from({ length: 10 }, () => null);
  inventory[0] = potion;

  const maxVitality = 40 + baseStats.vit * 4;

  return {
    version: 1,
    userId,
    nickname,
    playerClass,
    level: 1,
    xp: 0,
    gold: 50,
    diamonds: 0,
    honor: 100,
    baseStats: { ...baseStats },
    vitality: maxVitality,
    maxVitality,
    equipment,
    inventory,
    overflow: { item: null, expiresAt: null },
    ownedAnimals: [],
    expedition: null,
    patrol: null,
    activeBuffs: [],
    trinketCharges: [],
    mail: [],
    guildId: null,
    underworld: { completedFloors: [], lastAttemptByFloor: {} },
    tavernNpcIndex: 0,
    pendingTavernLoot: null,
    blacksmithOffers: rollBlacksmithOffers(1, playerClass),
  };
}
