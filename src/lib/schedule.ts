// Расписание коворкинга: какие дни и часы доступны для записи, часы работы для подвала.
// Чистые функции — используются и на сервере, и в модалке, и в превью админки.

import { nextDays } from "./format";
import type { CoworkingSchedule, WorkDay } from "./types";

/** Понедельник первым — как в админке и в расписании */
export const WEEK = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
export const WEEK_FULL = ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота", "Воскресенье"];

/** Индекс дня недели (0 = понедельник) для даты "YYYY-MM-DD" */
export function weekIndex(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7;
}

export type CwDay = {
  iso: string;
  wd: string;
  label: string;
  /** null — день открыт для записи; иначе причина, почему закрыт */
  closed: string | null;
  times: string[];
};

/** Дни ближайшего окна записи (daysAhead дней начиная с fromIso) */
export function coworkingDays(s: CoworkingSchedule, fromIso: string): CwDay[] {
  return nextDays(fromIso, s.daysAhead).map((d) => {
    const day = s.week[weekIndex(d.iso)];
    const holiday = s.closedDates.find((c) => c.date === d.iso);
    const closed = holiday ? holiday.reason || "Закрыто" : day.open ? null : "Выходной";
    const times = closed ? [] : s.slotTimes.filter((t) => t >= day.from && t < day.to);
    return { ...d, closed, times };
  });
}

/** Часы работы, сгруппированные по одинаковым дням: [["Пн–Пт", "12:00–22:00"], ["Сб–Вс", "10:00–20:00"]] */
export function hoursLines(week: WorkDay[]): [string, string][] {
  const val = (d: WorkDay) => (d.open ? `${d.from}–${d.to}` : "выходной");
  const lines: [string, string][] = [];
  let start = 0;
  for (let i = 1; i <= week.length; i++) {
    if (i < week.length && val(week[i]) === val(week[start])) continue;
    const days = i - 1 === start ? WEEK[start] : `${WEEK[start]}–${WEEK[i - 1]}`;
    lines.push([days, val(week[start])]);
    start = i;
  }
  return lines;
}
