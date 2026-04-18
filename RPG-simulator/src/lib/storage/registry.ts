import type { PlayerClass } from "@/lib/game/types";
import { STORAGE_SESSION, STORAGE_USERS } from "./keys";

export type RegistryUser = {
  id: string;
  nickname: string;
  password: string;
  playerClass: PlayerClass;
  createdAt: number;
  /** podsvětí – celkově poražená patra (pro síň slávy) */
  underworldFloorsCleared: number;
};

function readUsers(): RegistryUser[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_USERS);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RegistryUser[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeUsers(users: RegistryUser[]) {
  window.localStorage.setItem(STORAGE_USERS, JSON.stringify(users));
}

export function listRegisteredUsers(): RegistryUser[] {
  return readUsers();
}

export function findUserByNickname(nickname: string): RegistryUser | undefined {
  return readUsers().find((u) => u.nickname.toLowerCase() === nickname.trim().toLowerCase());
}

export function registerUser(entry: Omit<RegistryUser, "id" | "createdAt" | "underworldFloorsCleared">) {
  const users = readUsers();
  if (users.some((u) => u.nickname.toLowerCase() === entry.nickname.trim().toLowerCase())) {
    return { ok: false as const, error: "duplicate" };
  }
  const user: RegistryUser = {
    ...entry,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    underworldFloorsCleared: 0,
  };
  users.push(user);
  writeUsers(users);
  return { ok: true as const, user };
}

export function verifyLogin(nickname: string, password: string): RegistryUser | null {
  const u = findUserByNickname(nickname);
  if (!u || u.password !== password) return null;
  return u;
}

export function setSessionUserId(userId: string | null) {
  if (typeof window === "undefined") return;
  if (!userId) window.localStorage.removeItem(STORAGE_SESSION);
  else window.localStorage.setItem(STORAGE_SESSION, userId);
}

export function getSessionUserId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(STORAGE_SESSION);
}

export function bumpUnderworldClears(userId: string, floorsDelta: number) {
  const users = readUsers();
  const idx = users.findIndex((u) => u.id === userId);
  if (idx === -1) return;
  users[idx]!.underworldFloorsCleared += floorsDelta;
  writeUsers(users);
}
