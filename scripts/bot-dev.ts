// Локальная разработка бота: npm run bot:dev — вместе с npm run dev.
// Забирает сообщения dev-бота у Telegram (long polling) и пересылает их в локальный webhook,
// так что весь код бота работает внутри next dev, как на Vercel.
// В .env.development.local (или .env.local) — токен ОТДЕЛЬНОГО dev-бота: боевой работает через webhook, и polling его бы отключил.
//   npm run bot:dev                                  — пересылать на http://localhost:3000/api/telegram
//   npm run bot:dev -- http://localhost:3001/api/telegram

import { loadEnvConfig } from "@next/env";
import { BOT_COMMANDS } from "@/lib/bot/commands";

loadEnvConfig(process.cwd(), true); // как next dev: .env.development.local, .env.local, .env.development, .env

const token = process.env.TELEGRAM_BOT_TOKEN;
const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
const target = process.argv[2] ?? "http://localhost:3000/api/telegram";

async function api<T>(method: string, body: object = {}): Promise<T> {
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as { ok: boolean; result: T; description?: string };
  if (!json.ok) throw new Error(`${method}: ${json.description}`);
  return json.result;
}

const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  if (!token || !secret) throw new Error("Задайте TELEGRAM_BOT_TOKEN (dev-бота) и TELEGRAM_WEBHOOK_SECRET в .env.development.local — см. .env.example");

  const hook = await api<{ url: string }>("getWebhookInfo");
  if (hook.url) {
    throw new Error(
      `У этого бота настроен webhook ${hook.url} — похоже, это боевой бот.\n` +
        "Для разработки создайте отдельного бота у @BotFather и укажите его токен в .env.development.local.",
    );
  }
  await api("setMyCommands", { commands: BOT_COMMANDS });
  const me = await api<{ username: string }>("getMe");
  console.log(`@${me.username}: сообщения пересылаются на ${target}. Остановить — Ctrl+C`);

  let offset = 0;
  for (;;) {
    let updates: { update_id: number }[];
    try {
      updates = await api("getUpdates", { offset, timeout: 30, allowed_updates: ["message", "callback_query"] });
    } catch (e) {
      console.error("Telegram недоступен:", e instanceof Error ? e.message : e);
      await pause(3000);
      continue;
    }
    for (const u of updates) {
      offset = u.update_id + 1;
      try {
        const res = await fetch(target, {
          method: "POST",
          headers: { "content-type": "application/json", "x-telegram-bot-api-secret-token": secret },
          body: JSON.stringify(u),
        });
        if (!res.ok) console.error(`Webhook ответил ${res.status} на сообщение ${u.update_id}`);
      } catch {
        console.error(`Сайт не отвечает (${target}) — запущен ли npm run dev? Сообщение ${u.update_id} пропущено`);
      }
    }
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
