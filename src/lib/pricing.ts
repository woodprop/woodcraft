// Цены «от …» для текстов сайта и SEO. Считаются из данных,
// поэтому после правки цен в админке тексты обновляются сами.

import { formatHours } from "./format";
import type { Prices, SiteData } from "./types";

const min = (xs: number[]) => (xs.length ? Math.min(...xs) : 0);

export function getPrices(data: SiteData, visible = data.masterclasses.filter((m) => !m.hidden)): Prices {
  const hours = visible.map((m) => m.hours);
  const lo = formatHours(min(hours));
  const hi = formatHours(hours.length ? Math.max(...hours) : 0);
  return {
    mcFrom: min(visible.map((m) => m.price)),
    cwFrom: min(data.tariffs.map((t) => t.price)),
    familyFrom: data.family.price,
    mcHours: lo.long === hi.long ? lo.long : `${String(min(hours)).replace(".", ",")}–${hi.long}`,
  };
}

/** Метки, которые можно писать в текстах и SEO */
export const priceTokens: { key: keyof Prices; label: string }[] = [
  { key: "mcFrom", label: "мин. цена мастер-класса" },
  { key: "cwFrom", label: "мин. цена коворкинга" },
  { key: "familyFrom", label: "цена семейного занятия" },
];

/** Подставляет {mcFrom}, {cwFrom}, {familyFrom}, {mcHours}; неизвестные метки оставляет как есть */
export function fillPrices(str: string, p: Prices) {
  return str.replace(/\{(\w+)\}/g, (m, k: string) => (k in p ? String(p[k as keyof Prices]) : m));
}
