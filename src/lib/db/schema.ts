// Схема БД (Supabase Postgres). Миграции: npm run db:generate → npm run db:migrate.
// Списки, которые редактируются поштучно, — отдельные таблицы с полем position (порядок на сайте).
// Всё, что сохраняется целиком (тарифы, расписание коворкинга, SEO…), — jsonb в settings.
// RLS включён без политик: публичные ключи Supabase не видят ничего, доступ только с сервера.

import { boolean, doublePrecision, integer, jsonb, pgTable, primaryKey, serial, text, time, timestamp } from "drizzle-orm/pg-core";
import type { CoworkingSchedule, Family, GalleryCategory, Img, Option, Seo, SiteData, Tariff } from "../types";

export const masterclasses = pgTable("masterclasses", {
  id: text("id").primaryKey(),
  position: integer("position").notNull(),
  title: text("title").notNull(),
  desc: text("desc").notNull(),
  about: text("about").notNull(),
  hours: doublePrecision("hours").notNull(),
  price: integer("price").notNull(),
  capacity: integer("capacity").notNull(),
  image: jsonb("image").$type<Img>().notNull(),
  hidden: boolean("hidden").notNull().default(false),
}).enableRLS();

export const masterclassSessions = pgTable(
  "masterclass_sessions",
  {
    masterclassId: text("masterclass_id")
      .notNull()
      .references(() => masterclasses.id, { onDelete: "cascade" }),
    /** местное время Тбилиси, без часового пояса */
    start: timestamp("start", { mode: "string" }).notNull(),
    end: time("end").notNull(),
    seatsLeft: integer("seats_left").notNull(),
  },
  (t) => [primaryKey({ columns: [t.masterclassId, t.start] })],
).enableRLS();

export const galleryItems = pgTable("gallery_items", {
  id: text("id").primaryKey(),
  position: integer("position").notNull(),
  category: text("category").notNull(),
  title: text("title").notNull(),
  sub: text("sub").notNull(),
  image: jsonb("image").$type<Img>().notNull(),
  hidden: boolean("hidden").notNull().default(false),
}).enableRLS();

export const reviews = pgTable("reviews", {
  id: text("id").primaryKey(),
  position: integer("position").notNull(),
  name: text("name").notNull(),
  format: text("format").notNull(),
  text: text("text").notNull(),
  made: text("made").notNull(),
  hidden: boolean("hidden").notNull().default(false),
}).enableRLS();

/** Что лежит в settings: ключ → тип значения */
export type Settings = {
  tariffs: Tariff[];
  family: Family;
  certificateSums: Option[];
  coworking: CoworkingSchedule;
  galleryCategories: GalleryCategory[];
  seo: Seo;
};

export const settings = pgTable("settings", {
  key: text("key").$type<keyof Settings>().primaryKey(),
  value: jsonb("value").notNull(),
}).enableRLS();

/** Копия всех данных после каждого сохранения — чтобы можно было откатить ошибку в админке */
export const snapshots = pgTable("snapshots", {
  id: serial("id").primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  data: jsonb("data").$type<SiteData>().notNull(),
}).enableRLS();
