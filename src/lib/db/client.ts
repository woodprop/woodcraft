// Подключение к Postgres. Без "server-only": модуль нужен и скрипту scripts/seed.ts.
// В браузер он не попадает — его импортирует только src/lib/admin/index.ts (server-only).

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * Строка подключения. Интеграция Supabase в Vercel задаёт POSTGRES_URL (пулер, transaction mode)
 * и POSTGRES_URL_NON_POOLING (прямое подключение — для миграций).
 * Служебные параметры Supabase (supa, pgbouncer) убираем: postgres.js передал бы их серверу как настройки.
 */
export function databaseUrl(kind: "pooled" | "direct" = "pooled") {
  const raw = kind === "direct" ? (process.env.POSTGRES_URL_NON_POOLING ?? process.env.POSTGRES_URL) : process.env.POSTGRES_URL;
  if (!raw) return undefined;
  const url = new URL(raw);
  url.searchParams.delete("supa");
  url.searchParams.delete("pgbouncer");
  return url.toString();
}

export type Db = ReturnType<typeof createDb>;

export function createDb(url: string) {
  // prepare: false — пулер Supabase в transaction mode не поддерживает подготовленные запросы.
  // Новое подключение стоит ~0,5 с (TLS до Франкфурта), поэтому держим простаивающие подключения
  // 5 минут, а не закрываем через 20 с. Если пулер закроет подключение сам, postgres.js откроет новое.
  const sql = postgres(url, { prepare: false, max: 3, idle_timeout: 300, connect_timeout: 10 });
  return drizzle(sql, { schema });
}

// одно подключение на процесс (в dev модули перезагружаются, поэтому храним в globalThis)
const g = globalThis as typeof globalThis & { __woodcraftPg?: Db };

export function getDb(): Db {
  const url = databaseUrl();
  if (!url) throw new Error("POSTGRES_URL не задан");
  return (g.__woodcraftPg ??= createDb(url));
}
