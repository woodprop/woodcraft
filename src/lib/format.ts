// Форматирование дат без зависимости от Intl, чтобы сервер и клиент давали одинаковый текст.

const WD = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
const MON = ["янв", "фев", "мар", "апр", "мая", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];

function parts(iso: string) {
  const [d, t = ""] = iso.split("T");
  const [y, m, day] = d.split("-").map(Number);
  const wd = new Date(Date.UTC(y, m - 1, day)).getUTCDay();
  return { wd: WD[wd], day, mon: MON[m - 1], time: t.slice(0, 5) };
}

/** «Сб, 24 окт» */
export function formatDay(iso: string) {
  const p = parts(iso);
  return `${p.wd}, ${p.day} ${p.mon}`;
}

/** «Сб, 24 окт · 12:00» */
export function formatDateTime(iso: string) {
  const p = parts(iso);
  return `${p.wd}, ${p.day} ${p.mon} · ${p.time}`;
}

/** «12:00–14:00» */
export function formatRange(iso: string, end: string) {
  return `${parts(iso).time}–${end}`;
}

/** Ближайшие N дней начиная с даты ISO (YYYY-MM-DD) */
export function nextDays(fromIso: string, count: number) {
  const [y, m, d] = fromIso.split("-").map(Number);
  return Array.from({ length: count }, (_, i) => {
    const dt = new Date(Date.UTC(y, m - 1, d + i));
    return {
      iso: dt.toISOString().slice(0, 10),
      wd: WD[dt.getUTCDay()],
      label: `${dt.getUTCDate()} ${MON[dt.getUTCMonth()]}`,
    };
  });
}

/** Склонение: plural(2, ["человек", "человека", "человек"]) */
export function plural(n: number, forms: [string, string, string]) {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) return forms[2];
  if (b > 1 && b < 5) return forms[1];
  if (b === 1) return forms[0];
  return forms[2];
}
