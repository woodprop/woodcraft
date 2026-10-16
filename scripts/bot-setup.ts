// Подключение боевого Telegram-бота к сайту: регистрирует webhook и меню команд.
// Запускать один раз после деплоя (и после смены адреса сайта или секрета):
//   npm run bot:setup                      — адрес сайта из NEXT_PUBLIC_SITE_URL
//   npm run bot:setup -- https://woodcraft.ge
// Переменные берутся из окружения и файлов .env.production.local, .env.local, .env.production, .env.

import { loadEnvConfig } from "@next/env";
import { BOT_COMMANDS } from "@/lib/bot/commands";

loadEnvConfig(process.cwd(), false);

async function api<T>(token: string, method: string, body: object = {}): Promise<T> {
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as { ok: boolean; result: T; description?: string };
  if (!json.ok) throw new Error(`${method}: ${json.description}`);
  return json.result;
}

async function main() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  const site = (process.argv[2] ?? process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");
  if (!token || !secret) throw new Error("Задайте TELEGRAM_BOT_TOKEN и TELEGRAM_WEBHOOK_SECRET — см. .env.example");
  if (!/^[\w-]{16,256}$/.test(secret)) throw new Error("TELEGRAM_WEBHOOK_SECRET: от 16 символов, только латиница, цифры, _ и -");
  if (!site.startsWith("https://")) throw new Error("Нужен адрес сайта с https:// — аргументом или в NEXT_PUBLIC_SITE_URL");

  const url = `${site}/api/telegram`;
  await api(token, "setWebhook", { url, secret_token: secret, allowed_updates: ["message", "callback_query"], drop_pending_updates: true });
  await api(token, "setMyCommands", { commands: BOT_COMMANDS });
  const me = await api<{ username: string }>(token, "getMe");
  console.log(`Готово: @${me.username} получает сообщения на ${url}`);
  console.log("Проверьте, что на Vercel заданы те же TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET и TELEGRAM_ADMIN_IDS.");
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
