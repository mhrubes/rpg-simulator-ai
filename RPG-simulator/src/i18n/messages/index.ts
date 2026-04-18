import { cs } from "./cs";
import { en } from "./en";

export type AppLocale = "cs" | "en";

export const MESSAGES: Record<AppLocale, Record<string, string>> = { cs, en };
