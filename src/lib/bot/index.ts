import "server-only";

import { Bot } from "grammy";
import type { Update } from "grammy/types";
import { botConfig } from "./config";
import { coworking, coworkingSteps } from "./coworking";
import { gallery, gallerySteps } from "./gallery";
import { mainScreen, menu } from "./menu";
import { priceSteps, prices } from "./prices";
import { reviewSteps, reviews } from "./reviews";
import { schedule, scheduleSteps } from "./schedule";
import { flowStore, type BotContext, type Flow, type Steps } from "./state";
import { show, withNote } from "./ui";

// Telegram-бот для управления контентом сайта. Получает сообщения через webhook (src/app/api/telegram/route.ts).
// Меняет те же данные, что и /admin, через то же хранилище и те же проверки (src/lib/admin).

const steps: Steps = { ...scheduleSteps, ...gallerySteps, ...reviewSteps, ...priceSteps, ...coworkingSteps };

function createBot(cfg: NonNullable<ReturnType<typeof botConfig>>) {
  const bot = new Bot<BotContext>(cfg.token, { client: { apiRoot: cfg.apiRoot } });

  // ошибка в обработчике — сообщить админу, а Telegram ответить 200, чтобы он не повторял сообщение
  bot.use(async (ctx, next) => {
    try {
      await next();
    } catch (e) {
      console.error("Бот: ошибка обработки сообщения:", e);
      await ctx.reply("⚠️ Что-то пошло не так. Попробуйте ещё раз или откройте /menu").catch(() => {});
    }
  });

  // только личные сообщения от админов из TELEGRAM_ADMIN_IDS
  bot.use(async (ctx, next) => {
    if (ctx.chat?.type !== "private" || !ctx.from) return;
    if (cfg.admins.has(ctx.from.id)) return next();
    if (ctx.callbackQuery) await ctx.answerCallbackQuery("Нет доступа");
    else
      await ctx.reply(
        `Нет доступа. Ваш Telegram ID: <code>${ctx.from.id}</code> — передайте его администратору сайта, чтобы он добавил вас в TELEGRAM_ADMIN_IDS.`,
        { parse_mode: "HTML" },
      );
  });

  // шаг диалога: загрузить до обработки, сохранить после; повтор того же сообщения — пропустить
  bot.use(async (ctx, next) => {
    const chatId = ctx.chat!.id;
    const flow = await flowStore().claim(chatId, ctx.update.update_id);
    if (flow === undefined) return;
    let changed = false;
    ctx.flow = flow;
    ctx.setFlow = (f: Flow | null) => {
      ctx.flow = f;
      changed = true;
    };
    // команда или кнопка навигации прерывает начатый диалог; кнопки самого диалога начинаются с "f:"
    const data = ctx.callbackQuery?.data;
    if (flow && ((data && !data.startsWith("f:")) || ctx.message?.text?.startsWith("/"))) ctx.setFlow(null);
    try {
      await next();
    } finally {
      if (changed) await flowStore().save(chatId, ctx.flow);
      if (ctx.callbackQuery) await ctx.answerCallbackQuery().catch(() => {}); // убрать «часики» на кнопке
    }
  });

  bot.use(menu, schedule, gallery, reviews, prices, coworking);

  // текст — ответ на текущий шаг диалога
  bot.on("message:text", async (ctx) => {
    const flow = ctx.flow;
    const handler = flow && (steps[flow.step] as ((ctx: BotContext, text: string, flow: Flow) => Promise<void>) | undefined);
    if (flow && handler) return handler(ctx, ctx.message.text, flow);
    await show(ctx, withNote(mainScreen(), "Выберите, что изменить:"));
  });

  // кнопка, которую никто не обработал (например, из старого сообщения)
  bot.on("callback_query:data", async (ctx) => {
    await show(ctx, withNote(mainScreen(), "Эта кнопка устарела."));
  });

  return bot;
}

// в модуле, а не в globalThis: после правки кода в dev модуль перезагрузится вместе с ботом
let instance: Promise<Bot<BotContext>> | undefined;

/** Бот (один на процесс) или null, если не настроен */
export function getBot() {
  const cfg = botConfig();
  if (!cfg) return null;
  return (instance ??= (async () => {
    const bot = createBot(cfg);
    await bot.init(); // getMe — один раз на запуск функции
    return bot;
  })().catch((e) => {
    instance = undefined;
    throw e;
  }));
}

export async function handleUpdate(update: Update) {
  const bot = await getBot();
  await bot?.handleUpdate(update);
}
