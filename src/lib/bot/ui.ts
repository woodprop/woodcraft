import "server-only";

import { GrammyError, InlineKeyboard } from "grammy";
import { addMinutes } from "@/lib/admin/drafts";
import { formatDateTime, nextDays, tbilisiToday } from "@/lib/format";
import type { BotContext } from "./state";

/** Экран бота: текст (HTML) и кнопки под ним */
export type Screen = { text: string; kb?: InlineKeyboard; /** картинка-превью над текстом */ preview?: string };

export const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Строка-пометка над экраном: «✅ Сохранено» */
export const withNote = (screen: Screen, note?: string): Screen => (note ? { ...screen, text: `${note}\n\n${screen.text}` } : screen);

/**
 * Показать экран: после нажатия кнопки — заменить сообщение с кнопками,
 * после текста от админа — прислать новое.
 */
export async function show(ctx: BotContext, screen: Screen) {
  const opts = {
    parse_mode: "HTML" as const,
    reply_markup: screen.kb,
    link_preview_options: screen.preview
      ? { url: screen.preview, show_above_text: true, prefer_large_media: true }
      : { is_disabled: true },
  };
  if (ctx.callbackQuery?.message) {
    try {
      await ctx.editMessageText(screen.text, opts);
      return;
    } catch (e) {
      if (e instanceof GrammyError && e.description.includes("message is not modified")) return;
      // старое сообщение (или с фото) изменить нельзя — пришлём новое
    }
  }
  await ctx.reply(screen.text, opts);
}

/** Сообщение об ошибке ввода — диалог при этом продолжается */
export const warn = (ctx: BotContext, text: string) => ctx.reply(`⚠️ ${text}`, { parse_mode: "HTML" });

/** Кнопка от уже законченного или прерванного диалога */
export const stale = (ctx: BotContext) => ctx.answerCallbackQuery("Это действие уже неактуально").catch(() => {});

export const cancelKb = (kb = new InlineKeyboard()) => kb.text("✕ Отмена", "x");

/**
 * Короткая метка записи для кнопок: у Telegram на данные кнопки всего 64 байта,
 * а id может быть длинным. Запись ищем перебором (byRef).
 */
export function ref(id: string) {
  let h = 5381;
  for (let i = 0; i < id.length; i++) h = (h * 33) ^ id.charCodeAt(i);
  return (h >>> 0).toString(36);
}

export const byRef = <T extends { id: string }>(list: T[], r: string) => list.find((x) => ref(x.id) === r);

/** "2026-10-24T12:00" ⇄ "202610241200", "2026-10-24" ⇄ "20261024" — для данных кнопок */
export const pack = (iso: string) => iso.replace(/[-T:]/g, "");
export function unpack(p: string) {
  const date = `${p.slice(0, 4)}-${p.slice(4, 6)}-${p.slice(6, 8)}`;
  return p.length > 8 ? `${date}T${p.slice(8, 10)}:${p.slice(10, 12)}` : date;
}

/** Момент времени (ISO с зоной) по часам Тбилиси: «Пт, 16 окт · 14:32» */
export const formatMoment = (iso: string) => formatDateTime(new Date(Date.parse(iso) + 4 * 3600_000).toISOString().slice(0, 16));

/** Выбор дня: две недели на странице, начиная с сегодняшнего дня в Тбилиси */
export function datePicker(o: { pick: (iso: string) => string; page: number; toPage: (n: number) => string; back: string }) {
  const days = nextDays(tbilisiToday(), (o.page + 1) * 14).slice(o.page * 14);
  const kb = new InlineKeyboard();
  days.forEach((d, i) => {
    kb.text(`${d.wd} ${d.label}`, o.pick(d.iso));
    if (i % 3 === 2) kb.row();
  });
  kb.row();
  if (o.page > 0) kb.text("‹ Раньше", o.toPage(o.page - 1));
  if (o.page < 12) kb.text("Позже ›", o.toPage(o.page + 1));
  return kb.row().text("← Назад", o.back);
}

/** Кнопки с числами 0…max (текущее значение отмечено) */
export function numbersKb(max: number, data: (n: number) => string, current?: number) {
  const kb = new InlineKeyboard();
  for (let n = 0; n <= max; n++) {
    kb.text(n === current ? `· ${n} ·` : String(n), data(n));
    if (n % 7 === 6) kb.row();
  }
  return kb.row();
}

/** Страница списка: 8 кнопок и стрелки */
export function paged<T>(list: T[], page: number, size = 8) {
  const pages = Math.max(1, Math.ceil(list.length / size));
  const p = Math.min(Math.max(0, page), pages - 1);
  return { items: list.slice(p * size, (p + 1) * size), page: p, pages };
}

export function pagerRow(kb: InlineKeyboard, page: number, pages: number, data: (n: number) => string) {
  if (pages < 2) return kb;
  if (page > 0) kb.text("‹", data(page - 1));
  kb.text(`${page + 1} из ${pages}`, data(page));
  if (page < pages - 1) kb.text("›", data(page + 1));
  return kb.row();
}

const hhmm = (h: string, m = "00") => (Number(h) < 24 && Number(m) < 60 ? `${h.padStart(2, "0")}:${m}` : null);

/**
 * Время из текста: «12:00–14:30», «12-14», «12.30 14.30» или только начало «12:00»
 * (тогда конец = начало + minutes). Ошибка — строкой.
 */
export function parseRange(text: string, minutes?: number): { from: string; end: string } | string {
  const t = text.trim().replace(/\s+/g, " ");
  const T = String.raw`(\d{1,2})(?:[:.](\d{2}))?`;
  const range = new RegExp(String.raw`^${T}\s*(?:[-–—]|до| )\s*${T}$`).exec(t);
  const single = new RegExp(String.raw`^${T}$`).exec(t);
  const example = "Напишите время так: <code>12:00–14:30</code>";
  if (range) {
    const from = hhmm(range[1], range[2]);
    const end = hhmm(range[3], range[4]);
    if (!from || !end) return `Такого времени нет. ${example}`;
    if (end <= from) return "Конец должен быть позже начала";
    return { from, end };
  }
  if (single && minutes) {
    const from = hhmm(single[1], single[2]);
    if (!from) return `Такого времени нет. ${example}`;
    const end = addMinutes(from, minutes);
    if (end <= from) return "Занятие не помещается в этот день";
    return { from, end };
  }
  return `Не понял время. ${example}`;
}

/** Целое число из текста: «150», «150 ₾» */
export function parseNumber(text: string) {
  const t = text.replace(/[\s₾]|лари|gel/gi, "");
  return /^\d{1,6}$/.test(t) ? Number(t) : null;
}

/** Абсолютный адрес фото для превью в Telegram (локальные /images — через адрес сайта) */
export function photoUrl(src: string) {
  if (/^https?:\/\//.test(src)) return src;
  const site = process.env.NEXT_PUBLIC_SITE_URL;
  return src.startsWith("/") && site ? site.replace(/\/$/, "") + src : undefined;
}
