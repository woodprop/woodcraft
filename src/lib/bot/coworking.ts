import "server-only";

import { Composer, InlineKeyboard } from "grammy";
import { repo } from "@/lib/admin";
import { checkCoworking } from "@/lib/admin/validate";
import { formatDay, tbilisiToday } from "@/lib/format";
import type { CoworkingSchedule } from "@/lib/types";
import { commit } from "./save";
import { flowAt, type BotContext, type FlowAt, type Steps } from "./state";
import { cancelKb, datePicker, esc, pack, parseRange, show, stale, unpack, warn, withNote, type Screen } from "./ui";

// Коворкинг: часы работы по дням недели и закрытые даты.
// Кнопки: c — расписание; c:d:<день> — день недели; c:x:<стр.> — выбрать дату закрытия; c:o:<дата> — снова открыть.
// Время начала брони и на сколько дней открыта запись — в веб-админке.

const DAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const DAY_NAMES = ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота", "Воскресенье"];

function scheduleScreen(cw: CoworkingSchedule): Screen {
  // прошедшие закрытые даты сайту уже не важны — не показываем
  const closed = cw.closedDates.filter((x) => x.date >= tbilisiToday());
  const lines = [
    "🕒 <b>Коворкинг — часы работы</b>",
    "",
    ...cw.week.map((d, i) => `${DAYS[i]}  ${d.open ? `${d.from}–${d.to}` : "выходной"}`),
    "",
    closed.length ? "<b>Закрытые даты:</b>" : "Закрытых дат нет.",
    ...closed.map((x) => `• ${formatDay(x.date)}${x.reason ? ` — ${esc(x.reason)}` : ""}`),
  ];
  const kb = new InlineKeyboard();
  DAYS.forEach((d, i) => {
    kb.text(d, `c:d:${i}`);
    if (i === 3) kb.row();
  });
  kb.row().text("🚫 Закрыть дату", "c:x:0").row();
  for (const x of closed) kb.text(`✕ Открыть ${formatDay(x.date)}`, `c:o:${pack(x.date)}`).row();
  kb.text("← Меню", "m");
  return { text: lines.join("\n"), kb };
}

function dayScreen(cw: CoworkingSchedule, i: number): Screen {
  const d = cw.week[i];
  return {
    text: `<b>${DAY_NAMES[i]}</b>: ${d.open ? `${d.from}–${d.to}` : "выходной"}`,
    kb: new InlineKeyboard()
      .text("✏️ Изменить часы", `c:d:${i}:h`)
      .row()
      .text(d.open ? "Сделать выходным" : `Сделать рабочим (${d.from}–${d.to})`, `c:d:${i}:t`)
      .row()
      .text("← Назад", "c"),
  };
}

export const coworking = new Composer<BotContext>();

const load = async () => (await repo.load()).coworking;
const save = (ctx: BotContext, cw: CoworkingSchedule) => commit(ctx, checkCoworking(cw), (v) => repo.saveCoworking(v));

async function open(ctx: BotContext) {
  await show(ctx, scheduleScreen(await load()));
}

coworking.command("coworking", open);
coworking.callbackQuery("c", open);

coworking.callbackQuery(/^c:d:([0-6])$/, async (ctx) => {
  await show(ctx, dayScreen(await load(), Number(ctx.match[1])));
});

coworking.callbackQuery(/^c:d:([0-6]):t$/, async (ctx) => {
  const i = Number(ctx.match[1]);
  const cw = await load();
  const next = { ...cw, week: cw.week.map((d, j) => (j === i ? { ...d, open: !d.open } : d)) };
  if (await save(ctx, next)) await show(ctx, withNote(dayScreen(next, i), "✅ Сохранено."));
});

coworking.callbackQuery(/^c:d:([0-6]):h$/, async (ctx) => {
  const day = Number(ctx.match[1]);
  ctx.setFlow({ step: "c.hours", day });
  await show(ctx, { text: `<b>${DAY_NAMES[day]}</b>\nНапишите часы работы, например <code>10:00–20:00</code>:`, kb: cancelKb() });
});

coworking.callbackQuery(/^c:x:(\d+)$/, async (ctx) => {
  await show(ctx, {
    text: "В какой день коворкинг закрыт?",
    kb: datePicker({ page: Number(ctx.match[1]), pick: (d) => `c:xd:${pack(d)}`, toPage: (n) => `c:x:${n}`, back: "c" }),
  });
});

coworking.callbackQuery(/^c:xd:(\d{8})$/, async (ctx) => {
  const date = unpack(ctx.match[1]);
  ctx.setFlow({ step: "c.reason", date });
  await show(ctx, {
    text: `Закрыто: <b>${formatDay(date)}</b>\nПричина — её увидят на сайте (например «Санитарный день»). Необязательно.`,
    kb: cancelKb(new InlineKeyboard().text("Без причины", "f:cskip")),
  });
});

async function closeDate(ctx: BotContext, flow: FlowAt<"c.reason">, reason: string) {
  if (reason.length > 60) return void (await warn(ctx, `Слишком длинно: ${reason.length} символов из 60`));
  const cw = await load();
  const next = { ...cw, closedDates: [...cw.closedDates.filter((x) => x.date !== flow.date), { date: flow.date, reason }] };
  if (!(await save(ctx, next))) return;
  ctx.setFlow(null);
  await show(ctx, withNote(scheduleScreen(await load()), `🚫 ${formatDay(flow.date)} — закрыто.`));
}

coworking.callbackQuery("f:cskip", async (ctx) => {
  const flow = flowAt(ctx, "c.reason");
  if (!flow) return stale(ctx);
  await closeDate(ctx, flow, "");
});

coworking.callbackQuery(/^c:o:(\d{8})$/, async (ctx) => {
  const date = unpack(ctx.match[1]);
  const cw = await load();
  const next = { ...cw, closedDates: cw.closedDates.filter((x) => x.date !== date) };
  if (await save(ctx, next)) await show(ctx, withNote(scheduleScreen(next), `✅ ${formatDay(date)} — снова открыто.`));
});

export const coworkingSteps: Steps = {
  "c.hours": async (ctx, text, flow) => {
    const r = parseRange(text);
    if (typeof r === "string") return void (await warn(ctx, r));
    const cw = await load();
    const next = { ...cw, week: cw.week.map((d, j) => (j === flow.day ? { open: true, from: r.from, to: r.end } : d)) };
    if (!(await save(ctx, next))) return;
    ctx.setFlow(null);
    await show(ctx, withNote(dayScreen(next, flow.day), "✅ Сохранено."));
  },
  "c.reason": (ctx, text, flow) => closeDate(ctx, flow, text.trim()),
};
