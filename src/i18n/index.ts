import type { Locale } from "@/lib/types";
import { ru, type Dict } from "./ru";

export const locales: Locale[] = ["ru"];
export const defaultLocale: Locale = "ru";

const dictionaries: Record<Locale, Dict> = { ru };

export function getDict(locale: Locale = defaultLocale): Dict {
  return dictionaries[locale];
}

/** Подстановка {key} в строку */
export function t(str: string, vars: Record<string, string | number>) {
  return str.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));
}

export type { Dict };
