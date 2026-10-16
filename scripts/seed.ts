// Первичное заполнение БД данными из src/content/ru/*.json: npm run db:seed
// Если в базе уже есть данные, ничего не меняет. Перезаписать исходными: npm run db:seed -- --force

import { loadEnvConfig } from "@next/env";
import { count } from "drizzle-orm";
import { importSiteData } from "@/lib/admin/dbRepo";
import { seedData } from "@/lib/admin/seedData";
import { createDb, databaseUrl } from "@/lib/db/client";
import { settings } from "@/lib/db/schema";

loadEnvConfig(process.cwd());

async function main() {
  const url = databaseUrl();
  if (!url) throw new Error("Не задан POSTGRES_URL — см. .env.example");
  const db = createDb(url);
  try {
    const [{ n }] = await db.select({ n: count() }).from(settings);
    if (n > 0 && !process.argv.includes("--force")) {
      console.log("В базе уже есть данные — ничего не меняю. Перезаписать исходными: npm run db:seed -- --force");
      return;
    }
    await db.transaction((tx) => importSiteData(tx, seedData()));
    console.log("Готово: база заполнена данными из src/content/ru");
  } finally {
    await db.$client.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
