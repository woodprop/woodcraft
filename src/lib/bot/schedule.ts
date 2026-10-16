import "server-only";

import { Composer, InlineKeyboard } from "grammy";
import { repo } from "@/lib/admin";
import { toDraft } from "@/lib/admin/drafts";
import { checkFamily, checkMasterclass } from "@/lib/admin/validate";
import { formatDateTime, formatDay, formatHours, tbilisiToday } from "@/lib/format";
import type { Session, SiteData } from "@/lib/types";
import { checkOpts, commit, run } from "./save";
import { flowAt, type BotContext, type FlowAt, type Steps } from "./state";
import { byRef, cancelKb, stale, datePicker, esc, numbersKb, pack, parseNumber, parseRange, ref, show, unpack, warn, withNote, type Screen } from "./ui";

// Расписание: даты мастер-классов и семейного занятия, свободные места, скрыть/показать МК.
// Кнопки: sc — список; sc:<k> — занятие (k — ref(id) мастер-класса или "fam");
// ss:<k>:<начало> — одна дата; f:… — кнопки внутри диалога добавления даты.

const FAMILY = "fam";

/** Мастер-класс или семейное занятие: у обоих есть даты со свободными местами */
type Target = {
  k: string;
  title: string;
  capacity: number;
  minutes: number;
  sessions: Session[];
  mcId?: string;
  hidden?: boolean;
  save(ctx: BotContext, sessions: Session[]): Promise<boolean>;
};

function target(data: SiteData, k: string): Target | undefined {
  if (k === FAMILY) {
    const f = data.family;
    return {
      k,
      title: "Семейный мастер-класс",
      capacity: 20, // как в проверке checkFamily
      minutes: 120,
      sessions: f.sessions,
      save: (ctx, sessions) =>
        commit(ctx, checkFamily({ products: f.products, sessions: sessions.map(toDraft) }, f.price), (v) => repo.saveFamily(v)),
    };
  }
  const mc = byRef(data.masterclasses, k);
  if (!mc) return;
  return {
    k,
    title: mc.title,
    capacity: mc.capacity,
    minutes: mc.hours * 60,
    sessions: mc.sessions,
    mcId: mc.id,
    hidden: mc.hidden,
    save: (ctx, sessions) =>
      commit(ctx, checkMasterclass({ ...mc, sessions: sessions.map(toDraft) }, checkOpts()), (v) => repo.saveMasterclass(v)),
  };
}

const upcoming = (list: Session[]) =>
  list.filter((s) => s.start.slice(0, 10) >= tbilisiToday()).sort((a, b) => a.start.localeCompare(b.start));

/* ---------- Экраны ---------- */

function listScreen(data: SiteData): Screen {
  const kb = new InlineKeyboard();
  for (const m of data.masterclasses) kb.text(`${m.hidden ? "🙈 " : ""}${m.title} · ${upcoming(m.sessions).length}`, `sc:${ref(m.id)}`).row();
  kb.text(`👨‍👧 Семейный МК · ${upcoming(data.family.sessions).length}`, `sc:${FAMILY}`).row();
  kb.text("← Меню", "m");
  return { text: "📅 <b>Расписание</b>\nВыберите занятие. Число — сколько впереди дат.\n🙈 — скрыт с сайта.", kb };
}

function targetScreen(t: Target): Screen {
  const list = upcoming(t.sessions);
  const lines = [
    `<b>${esc(t.title)}</b>${t.hidden ? " · 🙈 скрыт с сайта" : ""}`,
    `Группа до ${t.capacity} · ${formatHours(t.minutes / 60).long}`,
    "",
    list.length ? "Ближайшие даты (свободно / всего):" : "Ближайших дат нет.",
    ...list.map((s) => `• ${formatDateTime(s.start)}–${s.end} — ${s.seatsLeft} / ${t.capacity}`),
  ];
  if (list.length) lines.push("", "Нажмите на дату, чтобы изменить места или удалить её.");
  const kb = new InlineKeyboard();
  for (const s of list.slice(0, 40)) kb.text(`${formatDateTime(s.start)} · ${s.seatsLeft} св.`, `ss:${t.k}:${pack(s.start)}`).row();
  kb.text("➕ Добавить дату", `sc:${t.k}:add:0`).row();
  if (t.mcId) kb.text(t.hidden ? "👁 Показать на сайте" : "🙈 Скрыть с сайта", `sc:${t.k}:${t.hidden ? "show" : "hide"}`).row();
  kb.text("← К списку", "sc");
  return { text: lines.join("\n"), kb };
}

function sessionScreen(t: Target, s: Session): Screen {
  const at = `ss:${t.k}:${pack(s.start)}`;
  return {
    text: `<b>${esc(t.title)}</b>\n${formatDateTime(s.start)}–${s.end}\nСвободно мест: ${s.seatsLeft} из ${t.capacity}`,
    kb: new InlineKeyboard()
      .text("✏️ Свободные места", `${at}:m`)
      .row()
      .text("🗑 Удалить дату", `${at}:del`)
      .row()
      .text("← Назад", `sc:${t.k}`),
  };
}

/* ---------- Переходы ---------- */

export const schedule = new Composer<BotContext>();

async function load(ctx: BotContext, k: string) {
  const data = await repo.load();
  const t = target(data, k);
  if (!t) await show(ctx, withNote(listScreen(data), "Этого занятия уже нет."));
  return t;
}

async function openList(ctx: BotContext) {
  await show(ctx, listScreen(await repo.load()));
}

schedule.command("schedule", openList);
schedule.callbackQuery("sc", openList);

schedule.callbackQuery(/^sc:(\w+)$/, async (ctx) => {
  const t = await load(ctx, ctx.match[1]);
  if (t) await show(ctx, targetScreen(t));
});

for (const hidden of [true, false]) {
  schedule.callbackQuery(new RegExp(`^sc:(\\w+):${hidden ? "hide" : "show"}$`), async (ctx) => {
    const t = await load(ctx, ctx.match[1]);
    if (!t?.mcId) return;
    if (!(await run(ctx, () => repo.setMasterclassHidden(t.mcId!, hidden)))) return;
    await show(ctx, withNote(targetScreen({ ...t, hidden }), hidden ? "🙈 Скрыт с сайта." : "👁 Снова на сайте."));
  });
}

/* ---------- Добавление даты: день → время → места ---------- */

schedule.callbackQuery(/^sc:(\w+):add:(\d+)$/, async (ctx) => {
  const t = await load(ctx, ctx.match[1]);
  if (!t) return;
  await show(ctx, {
    text: `<b>${esc(t.title)}</b>\nНа какой день добавить занятие?`,
    kb: datePicker({ page: Number(ctx.match[2]), pick: (d) => `sc:${t.k}:d:${pack(d)}`, toPage: (n) => `sc:${t.k}:add:${n}`, back: `sc:${t.k}` }),
  });
});

schedule.callbackQuery(/^sc:(\w+):d:(\d{8})$/, async (ctx) => {
  const t = await load(ctx, ctx.match[1]);
  if (!t) return;
  const date = unpack(ctx.match[2]);
  ctx.setFlow({ step: "sc.time", k: t.k, date });
  // быстрые кнопки — время уже существующих дат
  const kb = new InlineKeyboard();
  const times = [...new Set(t.sessions.map((s) => `${s.start.slice(11, 16)}–${s.end}`))].slice(-4);
  for (const x of times) kb.text(x, `f:sct:${x.replace(/\D/g, "")}`);
  if (times.length) kb.row();
  await show(ctx, {
    text: [
      `<b>${esc(t.title)}</b> · ${formatDay(date)}`,
      "",
      "Напишите время начала и конца, например <code>12:00–14:30</code>.",
      `Можно только начало — конец посчитаю по длительности (${formatHours(t.minutes / 60).long}).`,
    ].join("\n"),
    kb: cancelKb(kb),
  });
});

async function pickedTime(ctx: BotContext, flow: FlowAt<"sc.time">, from: string, end: string) {
  const t = await load(ctx, flow.k);
  if (!t) return ctx.setFlow(null);
  const start = `${flow.date}T${from}`;
  if (t.sessions.some((s) => s.start === start)) return void (await warn(ctx, "Такая дата и время уже есть. Напишите другое время"));
  ctx.setFlow({ step: "sc.seats", k: t.k, start, end });
  await show(ctx, {
    text: `<b>${esc(t.title)}</b>\n${formatDateTime(start)}–${end}\n\nСколько мест свободно? Группа до ${t.capacity}.`,
    kb: cancelKb(new InlineKeyboard().text(`Все свободны (${t.capacity})`, `f:scn:${t.capacity}`).row().append(numbersKb(t.capacity - 1, (n) => `f:scn:${n}`))),
  });
}

schedule.callbackQuery(/^f:sct:(\d{4})(\d{4})$/, async (ctx) => {
  const flow = flowAt(ctx, "sc.time");
  if (!flow) return stale(ctx);
  const [a, b] = [ctx.match[1], ctx.match[2]].map((x) => `${x.slice(0, 2)}:${x.slice(2)}`);
  await pickedTime(ctx, flow, a, b);
});

async function addSession(ctx: BotContext, flow: FlowAt<"sc.seats">, seats: number) {
  const t = await load(ctx, flow.k);
  if (!t) return ctx.setFlow(null);
  if (seats > t.capacity) return void (await warn(ctx, `Мест не может быть больше группы — ${t.capacity}`));
  const sessions = [...t.sessions, { start: flow.start, end: flow.end, seatsLeft: seats }];
  if (!(await t.save(ctx, sessions))) return;
  ctx.setFlow(null);
  await show(ctx, withNote(targetScreen({ ...t, sessions }), `✅ Добавлено: ${formatDateTime(flow.start)}–${flow.end}, свободно ${seats}.`));
}

schedule.callbackQuery(/^f:scn:(\d+)$/, async (ctx) => {
  const flow = flowAt(ctx, "sc.seats");
  if (!flow) return stale(ctx);
  await addSession(ctx, flow, Number(ctx.match[1]));
});

export const scheduleSteps: Steps = {
  "sc.time": async (ctx, text, flow) => {
    const t = await load(ctx, flow.k);
    if (!t) return ctx.setFlow(null);
    const r = parseRange(text, t.minutes);
    if (typeof r === "string") return void (await warn(ctx, r));
    await pickedTime(ctx, flow, r.from, r.end);
  },
  "sc.seats": async (ctx, text, flow) => {
    const n = parseNumber(text);
    if (n === null) return void (await warn(ctx, "Напишите число или нажмите кнопку"));
    await addSession(ctx, flow, n);
  },
};

/* ---------- Одна дата: места, удаление ---------- */

async function loadSession(ctx: BotContext, k: string, packed: string) {
  const t = await load(ctx, k);
  if (!t) return;
  const s = t.sessions.find((x) => x.start === unpack(packed));
  if (!s) await show(ctx, withNote(targetScreen(t), "Этой даты уже нет."));
  else return { t, s };
}

schedule.callbackQuery(/^ss:(\w+):(\d{12})$/, async (ctx) => {
  const r = await loadSession(ctx, ctx.match[1], ctx.match[2]);
  if (r) await show(ctx, sessionScreen(r.t, r.s));
});

schedule.callbackQuery(/^ss:(\w+):(\d{12}):m$/, async (ctx) => {
  const r = await loadSession(ctx, ctx.match[1], ctx.match[2]);
  if (!r) return;
  const at = `ss:${r.t.k}:${ctx.match[2]}`;
  await show(ctx, {
    text: `<b>${esc(r.t.title)}</b>\n${formatDateTime(r.s.start)}–${r.s.end}\n\nСколько мест свободно сейчас? Группа до ${r.t.capacity}.`,
    kb: numbersKb(r.t.capacity, (n) => `${at}:n:${n}`, r.s.seatsLeft).text("← Назад", at),
  });
});

schedule.callbackQuery(/^ss:(\w+):(\d{12}):n:(\d+)$/, async (ctx) => {
  const r = await loadSession(ctx, ctx.match[1], ctx.match[2]);
  if (!r) return;
  const seatsLeft = Math.min(Number(ctx.match[3]), r.t.capacity);
  const sessions = r.t.sessions.map((x) => (x.start === r.s.start ? { ...x, seatsLeft } : x));
  if (!(await r.t.save(ctx, sessions))) return;
  await show(ctx, withNote(sessionScreen({ ...r.t, sessions }, { ...r.s, seatsLeft }), "✅ Сохранено."));
});

schedule.callbackQuery(/^ss:(\w+):(\d{12}):del$/, async (ctx) => {
  const r = await loadSession(ctx, ctx.match[1], ctx.match[2]);
  if (!r) return;
  const at = `ss:${r.t.k}:${ctx.match[2]}`;
  await show(ctx, {
    text: `Удалить дату <b>${formatDateTime(r.s.start)}–${r.s.end}</b> у «${esc(r.t.title)}»?\nЕсли на неё уже записались — не забудьте предупредить людей.`,
    kb: new InlineKeyboard().text("🗑 Да, удалить", `${at}:del!`).row().text("Нет", at),
  });
});

schedule.callbackQuery(/^ss:(\w+):(\d{12}):del!$/, async (ctx) => {
  const r = await loadSession(ctx, ctx.match[1], ctx.match[2]);
  if (!r) return;
  const sessions = r.t.sessions.filter((x) => x.start !== r.s.start);
  if (!(await r.t.save(ctx, sessions))) return;
  await show(ctx, withNote(targetScreen({ ...r.t, sessions }), `🗑 Дата ${formatDateTime(r.s.start)} удалена.`));
});

