// Сессия админки: в cookie лежит хэш пароля. Модуль без "server-only",
// потому что используется и в proxy.ts.

export const ADMIN_COOKIE = "wc_admin";

/** Пароль из ADMIN_PASSWORD. В разработке без переменной — "admin", в продакшене вход закрыт. */
export function adminPassword(): string | null {
  const pw = process.env.ADMIN_PASSWORD;
  if (pw) return pw;
  return process.env.NODE_ENV === "production" ? null : "admin";
}

export async function sessionToken(pw: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`woodcraft-admin:${pw}`));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function isAdminToken(value: string | undefined) {
  const pw = adminPassword();
  if (!pw || !value) return false;
  return value === (await sessionToken(pw));
}
