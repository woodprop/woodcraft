import { loadEnvConfig } from "@next/env";
import { defineConfig } from "drizzle-kit";
import { databaseUrl } from "./src/lib/db/client";

loadEnvConfig(process.cwd());

// Миграции — через прямое подключение (POSTGRES_URL_NON_POOLING), если оно задано
export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: databaseUrl("direct") ?? "" },
});
