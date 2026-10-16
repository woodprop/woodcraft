import "server-only";

import { Composer, InlineKeyboard } from "grammy";
import { repo } from "@/lib/admin";
import type { PricesInput } from "@/lib/admin/repo";
import { checkPrices } from "@/lib/admin/validate";
import type { SiteData } from "@/lib/types";
import { commit } from "./save";
import { type BotContext, type FlowAt, type Steps } from "./state";
import { byRef, cancelKb, esc, parseNumber, ref, show, warn, withNote, type Screen } from "./ui";

// Цены: мастер-классы, семейный МК, тарифы коворкинга, номиналы сертификатов.
// Кнопки: p — все цены; p:<что>:<ref> — изменить одну (m — МК, f — семейный, t — тариф, c — сертификат).
// Названия и описания тарифов, добавление номиналов — в веб-админке.

type What = FlowAt<"p.price">["what"];

/** что меняем: название и текущая цена */
function find(data: SiteData, what: What, r: string): { label: string; price: number } | undefined {
  if (what === "f") return { label: "Семейный МК (за пару)", price: data.family.price };
  const list = what === "m" ? data.masterclasses : what === "t" ? data.tariffs : data.certificateSums;
  const x = byRef<{ id: string; price?: number; label?: string; title?: string }>(list, r);
  if (!x) return;
  const label = what === "m" ? x.title! : what === "t" ? `Коворкинг: ${x.label}` : `Сертификат ${x.label} ₾`;
  return { label, price: x.price ?? 0 };
}

function pricesScreen(data: SiteData): Screen {
  const lines = [
    "💰 <b>Цены, ₾</b>",
    "",
    "<b>Мастер-классы</b>",
    ...data.masterclasses.map((m) => `• ${esc(m.title)} — ${m.price}`),
    `• Семейный МК (за пару) — ${data.family.price}`,
    "",
    "<b>Коворкинг</b>",
    ...data.tariffs.map((t) => `• ${esc(t.label)} — ${t.price}`),
    "",
    `<b>Сертификаты:</b> ${data.certificateSums.map((c) => c.price).join(", ")}`,
    "",
    "Что изменить?",
  ];
  const kb = new InlineKeyboard();
  for (const m of data.masterclasses) kb.text(`${m.title} · ${m.price}`, `p:m:${ref(m.id)}`).row();
  kb.text(`Семейный МК · ${data.family.price}`, "p:f:0").row();
  data.tariffs.forEach((t, i) => {
    kb.text(`${t.label} · ${t.price}`, `p:t:${ref(t.id)}`);
    if (i % 2 === 1) kb.row();
  });
  kb.row();
  for (const c of data.certificateSums) kb.text(`🎁 ${c.price}`, `p:c:${ref(c.id)}`);
  kb.row().text("← Меню", "m");
  return { text: lines.join("\n"), kb };
}

export const prices = new Composer<BotContext>();

async function open(ctx: BotContext) {
  await show(ctx, pricesScreen(await repo.load()));
}

prices.command("prices", open);
prices.callbackQuery("p", open);

prices.callbackQuery(/^p:([mftc]):(\w+)$/, async (ctx) => {
  const data = await repo.load();
  const what = ctx.match[1] as What;
  const x = find(data, what, ctx.match[2]);
  if (!x) return show(ctx, withNote(pricesScreen(data), "Этого уже нет."));
  ctx.setFlow({ step: "p.price", what, r: ctx.match[2] });
  await show(ctx, { text: `<b>${esc(x.label)}</b>\nСейчас: ${x.price} ₾\n\nНапишите новую цену числом:`, kb: cancelKb() });
});

export const priceSteps: Steps = {
  "p.price": async (ctx, text, flow) => {
    const price = parseNumber(text);
    if (price === null) return void (await warn(ctx, "Напишите цену числом, например <code>150</code>"));
    const data = await repo.load();
    const x = find(data, flow.what, flow.r);
    if (!x) {
      ctx.setFlow(null);
      return show(ctx, withNote(pricesScreen(data), "Этого уже нет."));
    }
    const is = (id: string) => ref(id) === flow.r;
    // в checkPrices уходят все цены разом — как из формы в админке
    const input: PricesInput = {
      masterclasses: data.masterclasses.map((m) => ({ id: m.id, price: flow.what === "m" && is(m.id) ? price : m.price })),
      tariffs: data.tariffs.map((t) => (flow.what === "t" && is(t.id) ? { ...t, price } : t)),
      familyPrice: flow.what === "f" ? price : data.family.price,
      certificateSums: data.certificateSums.map((c) => (flow.what === "c" && is(c.id) ? { ...c, price } : c)),
    };
    if (!(await commit(ctx, checkPrices(input), (v) => repo.savePrices(v)))) return;
    ctx.setFlow(null);
    await show(ctx, withNote(pricesScreen(await repo.load()), `✅ ${esc(x.label)}: ${x.price} → ${price} ₾`));
  },
};
