export const STORAGE_USERS = "vaultborne_users_v1";
export const STORAGE_SESSION = "vaultborne_session_v1";
export const STORAGE_GUILD = "vaultborne_guilds_v1";
export const STORAGE_SAVE_PREFIX = "vaultborne_save_v1_";
export const STORAGE_ARENA_PREFIX = "vaultborne_arena_cd_v1_";

export function saveKeyForUser(userId: string) {
  return `${STORAGE_SAVE_PREFIX}${userId}`;
}

export function arenaKeyForUser(userId: string) {
  return `${STORAGE_ARENA_PREFIX}${userId}`;
}
