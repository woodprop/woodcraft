import "server-only";

import { Composer, InlineKeyboard } from "grammy";
import { repo } from "@/lib/admin";
import type { SiteData } from "@/lib/types";
import { published } from "./save";
import type { BotContext } from "./state";
import { formatMoment, show, warn, withNote, type Screen } from "./ui";

// Главное меню, отмена диалога (x, /cancel) и отмена последнего изменения (u, /undo).

export function mainScreen(): Screen {
  const lines = ["🪵 <b>WoodCraft — управление сайтом</b>", "Что меняем?"];
  if (repo.demo) lines.push("", "⚠️ Демо-режим: база не подключена, изменения пропадут при перезапуске сервера.");
  return {
    text: lines.join("\n"),
    kb: new InlineKeyboard()
      .text("📅 Расписание", "sc")
      .text("📷 Галерея", "g")
      .row()
      .text("💬 Отзывы", "r")
      .text("💰 Цены", "p")
      .row()
      .text("🕒 Коворкинг", "c")
      .text("↩️ Отменить", "u"),
  };
}

const SECTIONS: Record<keyof SiteData, string> = {
  masterclasses: "мастер-классы и их расписание",
  tariffs: "тарифы коворкинга",
  family: "семейный мастер-класс",
  certificateSums: "сертификаты",
  coworking: "часы работы коворкинга",
  gallery: "галерея",
  reviews: "отзывы",
  seo: "SEO",
};

export const menu = new Composer<BotContext>();

const openMain = (ctx: BotContext) => show(ctx, mainScreen());

menu.command(["start", "menu"], openMain);
menu.callbackQuery("m", openMain);

// начатый диалог к этому моменту уже сброшен (см. src/lib/bot/index.ts)
const cancel = (ctx: BotContext) => show(ctx, withNote(mainScreen(), "Отменено."));
menu.command("cancel", cancel);
menu.callbackQuery("x", cancel);

/* ---------- Отмена последнего изменения ---------- */

async function openUndo(ctx: BotContext) {
  const last = await repo.lastChange();
  if (!last) {
    return show(ctx, {
      text: "↩️ Отменять нечего: нет сохранённой копии данных до последнего изменения.",
      kb: new InlineKeyboard().text("← Меню", "m"),
    });
  }
  await show(ctx, {
    text: [
      "↩️ <b>Отменить последнее изменение?</b>",
      "",
      `Когда: ${formatMoment(last.at)}`,
      `Что менялось: ${last.sections.map((s) => SECTIONS[s] ?? s).join(", ") || "—"}`,
      "",
      "Сайт вернётся к состоянию до этого изменения. Это касается и правок, сделанных в веб-админке.",
    ].join("\n"),
    kb: new InlineKeyboard().text("↩️ Да, отменить", `u:${last.id}`).row().text("← Меню", "m"),
  });
}

menu.command("undo", openUndo);
menu.callbackQuery("u", openUndo);

menu.callbackQuery(/^u:(\d+)$/, async (ctx) => {
  let ok: boolean;
  try {
    ok = await repo.undo(Number(ctx.match[1]));
  } catch (e) {
    console.error("Бот: ошибка отмены изменения:", e);
    return void (await warn(ctx, "Не удалось отменить: база данных недоступна. Попробуйте ещё раз через минуту"));
  }
  if (!ok) return show(ctx, withNote(mainScreen(), "Не получилось: данные успели измениться. Откройте /undo заново."));
  published();
  await show(ctx, withNote(mainScreen(), "✅ Изменение отменено. Можно отменить и предыдущее — /undo."));
});
