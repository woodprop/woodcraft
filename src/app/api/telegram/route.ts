import { timingSafeEqual } from "node:crypto";
import type { Update } from "grammy/types";
import { handleUpdate } from "@/lib/bot";
import { botConfig } from "@/lib/bot/config";

/**
 * Webhook Telegram-бота (src/lib/bot). Telegram присылает сюда каждое сообщение админов
 * с секретом в заголовке — его задаёт npm run bot:setup при регистрации webhook.
 * Без TELEGRAM_BOT_TOKEN и TELEGRAM_WEBHOOK_SECRET маршрута как будто нет.
 */
export async function POST(req: Request) {
  const cfg = botConfig();
  if (!cfg) return new Response(null, { status: 404 });

  const got = Buffer.from(req.headers.get("x-telegram-bot-api-secret-token") ?? "");
  const want = Buffer.from(cfg.secret);
  if (got.length !== want.length || !timingSafeEqual(got, want)) return new Response(null, { status: 401 });

  let update: Update;
  try {
    update = await req.json();
  } catch {
    return new Response(null, { status: 400 });
  }

  // ошибки сообщений обрабатывает сам бот; здесь — только сбой запуска (например, неверный токен).
  // Отвечаем 200 в любом случае: иначе Telegram будет повторять это сообщение
  try {
    await handleUpdate(update);
  } catch (e) {
    console.error("Бот: не удалось обработать сообщение:", e);
  }
  return Response.json({ ok: true });
}
