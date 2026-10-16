import "server-only";

/**
 * Настройки Telegram-бота из окружения. Без токена или секрета бот выключен.
 * TELEGRAM_ADMIN_IDS — Telegram ID админов через запятую; остальным бот отвечает «нет доступа».
 * TELEGRAM_API_ROOT — свой сервер Bot API (для тестов); по умолчанию api.telegram.org.
 */
export function botConfig() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!token || !secret) return null;
  const admins = new Set(
    (process.env.TELEGRAM_ADMIN_IDS ?? "")
      .split(/[\s,;]+/)
      .filter(Boolean)
      .map(Number)
      .filter(Number.isSafeInteger),
  );
  const apiRoot = (process.env.TELEGRAM_API_ROOT || "https://api.telegram.org").replace(/\/$/, "");
  return { token, secret, admins, apiRoot };
}
