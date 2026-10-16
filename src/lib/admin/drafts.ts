// Общие помощники форм админки (работают и в браузере).

import type { Session } from "@/lib/types";

/** Дата занятия в форме: отдельно день, начало и конец */
export type SessionDraft = { date: string; from: string; end: string; seatsLeft: number };

export const toDraft = (x: Session): SessionDraft => ({
  date: x.start.slice(0, 10),
  from: x.start.slice(11, 16),
  end: x.end,
  seatsLeft: x.seatsLeft,
});

export function toMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

/** "18:00" + 150 мин → "20:30" (не дальше 23:59) */
export function addMinutes(t: string, min: number) {
  const v = Math.min(23 * 60 + 59, Math.max(0, toMinutes(t) + min));
  return `${String(Math.floor(v / 60)).padStart(2, "0")}:${String(v % 60).padStart(2, "0")}`;
}

/** "2026-10-16" + 7 дней */
export function addDays(iso: string, days: number) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/** Сегодня по часам браузера — "YYYY-MM-DD" */
export function localToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const TR: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i", й: "y", к: "k", л: "l", м: "m",
  н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sch",
  ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
};

/** Идентификатор для адреса из названия: «Табурет из дуба» → "taburet-iz-duba" */
export function slugify(title: string, taken: string[] = []) {
  const base =
    title
      .toLowerCase()
      .split("")
      .map((ch) => TR[ch] ?? ch)
      .join("")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "item";
  let id = base;
  for (let i = 2; taken.includes(id); i++) id = `${base}-${i}`;
  return id;
}

/** Короткий случайный идентификатор для новых записей */
export const uid = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 9)}`;

/** Короткий отпечаток данных — для key, чтобы форма пересоздавалась, когда данные на сервере изменились */
export function version(value: unknown) {
  const str = JSON.stringify(value);
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = (h * 33) ^ str.charCodeAt(i);
  return (h >>> 0).toString(36) + str.length.toString(36);
}
