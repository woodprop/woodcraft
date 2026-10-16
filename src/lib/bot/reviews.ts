import "server-only";

import { Composer, InlineKeyboard } from "grammy";
import { repo } from "@/lib/admin";
import { REVIEW_FORMATS, uid } from "@/lib/admin/drafts";
import { checkReviews } from "@/lib/admin/validate";
import type { ReviewRec } from "@/lib/types";
import { commit } from "./save";
import { flowAt, type BotContext, type FlowAt, type Steps } from "./state";
import { byRef, cancelKb, esc, paged, pagerRow, ref, show, stale, warn, withNote, type Screen } from "./ui";

// Отзывы: добавить (имя → формат → текст → что сделал), скрыть, удалить.
// Кнопки: r — раздел; r:add; r:l:<стр.> — список; r:i:<ref> — отзыв; f:rf:<№ формата>, f:rskip — внутри диалога.

function menuScreen(list: ReviewRec[]): Screen {
  const hidden = list.filter((r) => r.hidden).length;
  return {
    text: `💬 <b>Отзывы</b>\nНа сайте ${list.length - hidden}${hidden ? `, скрыто ${hidden}` : ""}.`,
    kb: new InlineKeyboard().text("➕ Добавить отзыв", "r:add").row().text("📋 Все отзывы", "r:l:0").row().text("← Меню", "m"),
  };
}

function listScreen(list: ReviewRec[], page: number): Screen {
  const p = paged(list, page);
  const kb = new InlineKeyboard();
  for (const r of p.items) kb.text(`${r.hidden ? "🙈 " : ""}${r.name} · ${r.text.length > 30 ? `${r.text.slice(0, 30)}…` : r.text}`, `r:i:${ref(r.id)}`).row();
  pagerRow(kb, p.page, p.pages, (n) => `r:l:${n}`);
  kb.text("← Отзывы", "r");
  return { text: "📋 <b>Отзывы</b> — в том порядке, как на сайте.\n🙈 — скрыт с сайта.", kb };
}

function itemScreen(list: ReviewRec[], r: ReviewRec): Screen {
  const at = `r:i:${ref(r.id)}`;
  return {
    text: [
      `<b>${esc(r.name)}</b> · ${esc(r.format)}${r.hidden ? " · 🙈 скрыт с сайта" : ""}`,
      "",
      esc(r.text),
      ...(r.made ? ["", `Сделал(а): ${esc(r.made)}`] : []),
    ].join("\n"),
    kb: new InlineKeyboard()
      .text(r.hidden ? "👁 Показать на сайте" : "🙈 Скрыть с сайта", `${at}:h`)
      .row()
      .text("🗑 Удалить", `${at}:del`)
      .row()
      .text("← К списку", `r:l:${Math.floor(list.indexOf(r) / 8)}`),
  };
}

export const reviews = new Composer<BotContext>();

async function openMenu(ctx: BotContext) {
  await show(ctx, menuScreen((await repo.load()).reviews));
}

reviews.command("reviews", openMenu);
reviews.callbackQuery("r", openMenu);

reviews.callbackQuery(/^r:l:(\d+)$/, async (ctx) => {
  await show(ctx, listScreen((await repo.load()).reviews, Number(ctx.match[1])));
});

async function loadItem(ctx: BotContext, r: string) {
  const list = (await repo.load()).reviews;
  const x = byRef(list, r);
  if (!x) await show(ctx, withNote(listScreen(list, 0), "Этого отзыва уже нет."));
  else return { list, x };
}

const save = (ctx: BotContext, list: ReviewRec[]) => commit(ctx, checkReviews(list), (v) => repo.saveReviews(v));

reviews.callbackQuery(/^r:i:(\w+)$/, async (ctx) => {
  const r = await loadItem(ctx, ctx.match[1]);
  if (r) await show(ctx, itemScreen(r.list, r.x));
});

reviews.callbackQuery(/^r:i:(\w+):h$/, async (ctx) => {
  const r = await loadItem(ctx, ctx.match[1]);
  if (!r) return;
  const x = { ...r.x, hidden: !r.x.hidden };
  const list = r.list.map((i) => (i.id === x.id ? x : i));
  if (await save(ctx, list)) await show(ctx, withNote(itemScreen(list, x), x.hidden ? "🙈 Скрыт с сайта." : "👁 Снова на сайте."));
});

reviews.callbackQuery(/^r:i:(\w+):del$/, async (ctx) => {
  const r = await loadItem(ctx, ctx.match[1]);
  if (!r) return;
  const at = `r:i:${ctx.match[1]}`;
  await show(ctx, {
    text: `Удалить отзыв от <b>${esc(r.x.name)}</b>?\nЕсли нужно только убрать с сайта на время — лучше скрыть.`,
    kb: new InlineKeyboard().text("🗑 Да, удалить", `${at}:del!`).row().text("Нет", at),
  });
});

reviews.callbackQuery(/^r:i:(\w+):del!$/, async (ctx) => {
  const r = await loadItem(ctx, ctx.match[1]);
  if (!r) return;
  const list = r.list.filter((i) => i.id !== r.x.id);
  if (await save(ctx, list)) await show(ctx, withNote(menuScreen(list), `🗑 Отзыв от ${esc(r.x.name)} удалён.`));
});

/* ---------- Добавление ---------- */

reviews.callbackQuery("r:add", async (ctx) => {
  ctx.setFlow({ step: "r.name" });
  await show(ctx, { text: "Имя автора отзыва, как оно будет на сайте (например «Анна»):", kb: cancelKb() });
});

async function pickedFormat(ctx: BotContext, flow: FlowAt<"r.format">, format: string) {
  ctx.setFlow({ step: "r.text", name: flow.name, format });
  await show(ctx, { text: `<b>${esc(flow.name)}</b> · ${esc(format)}\nТеперь текст отзыва (до 600 символов):`, kb: cancelKb() });
}

reviews.callbackQuery(/^f:rf:(\d+)$/, async (ctx) => {
  const flow = flowAt(ctx, "r.format");
  const format = REVIEW_FORMATS[Number(ctx.match[1])];
  if (!flow || !format) return stale(ctx);
  await pickedFormat(ctx, flow, format);
});

async function addReview(ctx: BotContext, flow: FlowAt<"r.made">, made: string) {
  const list = (await repo.load()).reviews;
  const next = [{ id: uid("r"), name: flow.name, format: flow.format, text: flow.text, made }, ...list];
  if (!(await save(ctx, next))) return;
  ctx.setFlow(null);
  await show(ctx, withNote(menuScreen(next), `✅ Отзыв от ${esc(flow.name)} добавлен — первым в списке.`));
}

reviews.callbackQuery("f:rskip", async (ctx) => {
  const flow = flowAt(ctx, "r.made");
  if (!flow) return stale(ctx);
  await addReview(ctx, flow, "");
});

/** проверка длины сразу на шаге — чтобы не потерять остальное введённое */
async function fits(ctx: BotContext, text: string, max: number) {
  if (text.length <= max) return true;
  await warn(ctx, `Слишком длинно: ${text.length} символов из ${max}. Сократите и пришлите ещё раз`);
  return false;
}

export const reviewSteps: Steps = {
  "r.name": async (ctx, text) => {
    const name = text.trim();
    if (!(await fits(ctx, name, 40))) return;
    ctx.setFlow({ step: "r.format", name });
    const kb = new InlineKeyboard();
    REVIEW_FORMATS.forEach((f, i) => {
      kb.text(f, `f:rf:${i}`);
      if (i % 2 === 1) kb.row();
    });
    await show(ctx, { text: `<b>${esc(name)}</b>\nО чём отзыв? Выберите или напишите свой вариант (до 30 символов).`, kb: cancelKb(kb.row()) });
  },
  "r.format": async (ctx, text, flow) => {
    const format = text.trim();
    if (await fits(ctx, format, 30)) await pickedFormat(ctx, flow, format);
  },
  "r.text": async (ctx, text, flow) => {
    const t = text.trim();
    if (!(await fits(ctx, t, 600))) return;
    ctx.setFlow({ step: "r.made", name: flow.name, format: flow.format, text: t });
    await show(ctx, {
      text: "Что сделал(а) на занятии — например «Разделочную доску». Необязательно.",
      kb: cancelKb(new InlineKeyboard().text("Пропустить", "f:rskip")),
    });
  },
  "r.made": async (ctx, text, flow) => {
    const made = text.trim();
    if (await fits(ctx, made, 60)) await addReview(ctx, flow, made);
  },
};
