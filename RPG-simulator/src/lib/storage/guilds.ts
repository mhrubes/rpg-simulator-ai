import type { Guild } from "@/lib/game/types";
import { STORAGE_GUILD } from "./keys";

function readAll(): Guild[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_GUILD);
    if (!raw) return [];
    const p = JSON.parse(raw) as Guild[];
    return Array.isArray(p) ? p : [];
  } catch {
    return [];
  }
}

function writeAll(g: Guild[]) {
  window.localStorage.setItem(STORAGE_GUILD, JSON.stringify(g));
}

export function listGuilds(): Guild[] {
  return readAll();
}

export function getGuild(id: string): Guild | undefined {
  return readAll().find((g) => g.id === id);
}

export function upsertGuild(guild: Guild) {
  const all = readAll();
  const idx = all.findIndex((g) => g.id === guild.id);
  if (idx === -1) all.push(guild);
  else all[idx] = guild;
  writeAll(all);
}
