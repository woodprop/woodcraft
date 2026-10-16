// Хранилище контента в Postgres (Supabase).
// Без "server-only": loadSiteData и importSiteData нужны и скрипту scripts/seed.ts.
//
// Каждый запрос — это поездка до базы (~70 мс из Тбилиси, ~2 мс из Vercel fra1), а запросы
// внутри транзакции идут строго по очереди. Поэтому чтение — один запрос, а запись
// собирается в как можно меньшее число запросов.

import { desc, eq, sql } from "drizzle-orm";
import type { Db } from "@/lib/db/client";
import { galleryItems, masterclassSessions, masterclasses, reviews, settings, snapshots, uploads, type Settings } from "@/lib/db/schema";
import type { GalleryItem, Img, MasterclassRec, ReviewRec, Session, SiteData } from "@/lib/types";
import type { ContentRepo } from "./repo";

/** сколько последних копий данных хранить в snapshots */
const SNAPSHOTS_KEPT = 30;

type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];
type Exec = Db | Tx;

const SETTING_KEYS = ["tariffs", "family", "certificateSums", "coworking", "galleryCategories", "seo"] as const satisfies (keyof Settings)[];

// В JSON Postgres отдаёт "2026-10-24T12:00:00" и "14:00:00", сайт ждёт "2026-10-24T12:00" и "14:00"
const toStart = (v: string) => v.slice(0, 16).replace(" ", "T");
const toTime = (v: string) => v.slice(0, 5);

/** результат db.execute: у postgres.js — массив строк, у других драйверов — { rows } */
function rowsOf<T>(res: unknown): T[] {
  return (Array.isArray(res) ? res : (res as { rows: T[] }).rows) as T[];
}

/* ---------- Чтение ---------- */

// строки таблиц в том виде, в каком их отдаёт json_agg (имена колонок из БД)
type McRow = { id: string; title: string; desc: string; about: string; hours: number; price: number; capacity: number; image: Img; hidden: boolean };
type SessionRow = { masterclass_id: string; start: string; end: string; seats_left: number };
type GalleryRow = { id: string; category: string; title: string; sub: string; image: Img; hidden: boolean };
type ReviewRow = { id: string; name: string; format: string; text: string; made: string; hidden: boolean };
type LoadRow = { mcs: McRow[]; sessions: SessionRow[]; gallery: GalleryRow[]; reviews: ReviewRow[]; settings: Partial<Settings> };

/** все данные одним запросом */
const LOAD = sql`select
  (select coalesce(json_agg(t order by t.position), '[]') from ${masterclasses} t) as mcs,
  (select coalesce(json_agg(t order by t."start"), '[]') from ${masterclassSessions} t) as sessions,
  (select coalesce(json_agg(t order by t.position), '[]') from ${galleryItems} t) as gallery,
  (select coalesce(json_agg(t order by t.position), '[]') from ${reviews} t) as reviews,
  (select coalesce(json_object_agg(t.key, t.value), '{}') from ${settings} t) as settings`;

export async function loadSiteData(db: Exec): Promise<SiteData> {
  const [r] = rowsOf<LoadRow>(await db.execute(LOAD));
  const s = r.settings;
  const missing = SETTING_KEYS.filter((k) => s[k] === undefined);
  if (missing.length) throw new Error(`В базе нет настроек: ${missing.join(", ")}. Заполните её: npm run db:seed`);

  const sessions = new Map<string, Session[]>();
  for (const x of r.sessions) {
    const list = sessions.get(x.masterclass_id) ?? [];
    list.push({ start: toStart(x.start), end: toTime(x.end), seatsLeft: x.seats_left });
    sessions.set(x.masterclass_id, list);
  }

  return {
    masterclasses: r.mcs.map(
      (m): MasterclassRec => ({
        id: m.id,
        title: m.title,
        desc: m.desc,
        about: m.about,
        hours: m.hours,
        price: m.price,
        capacity: m.capacity,
        image: m.image,
        sessions: sessions.get(m.id) ?? [],
        ...(m.hidden && { hidden: true }),
      }),
    ),
    tariffs: s.tariffs!,
    family: s.family!,
    certificateSums: s.certificateSums!,
    coworking: s.coworking!,
    gallery: {
      categories: s.galleryCategories!,
      items: r.gallery.map(
        (g): GalleryItem => ({
          id: g.id,
          category: g.category,
          title: g.title,
          sub: g.sub,
          image: g.image,
          ...(g.hidden && { hidden: true }),
        }),
      ),
    },
    reviews: r.reviews.map(
      (x): ReviewRec => ({
        id: x.id,
        name: x.name,
        format: x.format,
        text: x.text,
        made: x.made,
        ...(x.hidden && { hidden: true }),
      }),
    ),
    seo: s.seo!,
  };
}

/* ---------- Запись ---------- */

/** несколько настроек одним запросом */
async function setSettings(db: Exec, values: Partial<Settings>) {
  const rows = Object.entries(values).map(([key, value]) => ({ key: key as keyof Settings, value }));
  if (!rows.length) return;
  await db.insert(settings).values(rows).onConflictDoUpdate({ target: settings.key, set: { value: sql`excluded.value` } });
}

async function writeSessions(db: Exec, id: string, list: Session[]) {
  await db.delete(masterclassSessions).where(eq(masterclassSessions.masterclassId, id));
  if (list.length) {
    await db.insert(masterclassSessions).values(list.map((x) => ({ masterclassId: id, start: x.start, end: x.end, seatsLeft: x.seatsLeft })));
  }
}

/** создать или обновить мастер-класс; новый — в конец списка, у существующего место не меняется */
async function writeMasterclass(db: Exec, mc: MasterclassRec, position?: number) {
  const fields = {
    title: mc.title,
    desc: mc.desc,
    about: mc.about,
    hours: mc.hours,
    price: mc.price,
    capacity: mc.capacity,
    image: mc.image,
    hidden: mc.hidden === true,
  };
  await db
    .insert(masterclasses)
    .values({
      id: mc.id,
      position: position ?? sql`(select coalesce(max(${masterclasses.position}) + 1, 0) from ${masterclasses})`,
      ...fields,
    })
    .onConflictDoUpdate({ target: masterclasses.id, set: fields });
  await writeSessions(db, mc.id, mc.sessions);
}

/** галерея и отзывы сохраняются целиком: заменяем все строки (внутри транзакции) */
async function replaceGalleryItems(db: Exec, items: GalleryItem[]) {
  await db.delete(galleryItems);
  if (items.length) {
    await db.insert(galleryItems).values(
      items.map((g, position) => ({ id: g.id, position, category: g.category, title: g.title, sub: g.sub, image: g.image, hidden: g.hidden === true })),
    );
  }
}

async function replaceReviews(db: Exec, list: ReviewRec[]) {
  await db.delete(reviews);
  if (list.length) {
    await db.insert(reviews).values(
      list.map((r, position) => ({ id: r.id, position, name: r.name, format: r.format, text: r.text, made: r.made, hidden: r.hidden === true })),
    );
  }
}

/** Записать все данные целиком (первичное заполнение, откат к копии). Вызывать внутри транзакции. */
export async function importSiteData(db: Exec, data: SiteData) {
  await db.delete(masterclasses); // даты удалятся каскадом
  for (const [position, mc] of data.masterclasses.entries()) await writeMasterclass(db, mc, position);
  await replaceGalleryItems(db, data.gallery.items);
  await replaceReviews(db, data.reviews);
  await setSettings(db, {
    tariffs: data.tariffs,
    family: data.family,
    certificateSums: data.certificateSums,
    coworking: data.coworking,
    galleryCategories: data.gallery.categories,
    seo: data.seo,
  });
}

/* ---------- Репозиторий для админки ---------- */

export function createDbRepo(db: Db): ContentRepo {
  /** изменение в транзакции; в той же транзакции — копия всех данных в snapshots (и удаление старых копий) */
  async function write(fn: (tx: Tx) => Promise<unknown>) {
    await db.transaction(async (tx) => {
      await fn(tx);
      const data = JSON.stringify(await loadSiteData(tx));
      await tx.execute(sql`with added as (insert into snapshots (data) values (${data}::jsonb) returning id)
        delete from snapshots where id <= (select id from added) - ${SNAPSHOTS_KEPT}`);
    });
  }

  return {
    demo: false,
    load: () => loadSiteData(db),

    saveMasterclass: (mc) => write((tx) => writeMasterclass(tx, mc)),

    deleteMasterclass: (id) => write((tx) => tx.delete(masterclasses).where(eq(masterclasses.id, id))),

    reorderMasterclasses: (ids) =>
      write((tx) =>
        tx.execute(sql`update ${masterclasses} m set position = v.ord - 1
          from jsonb_array_elements_text(${JSON.stringify(ids)}::jsonb) with ordinality as v(id, ord)
          where m.id = v.id`),
      ),

    setMasterclassHidden: (id, hidden) => write((tx) => tx.update(masterclasses).set({ hidden }).where(eq(masterclasses.id, id))),

    saveFamily: (family) => write((tx) => setSettings(tx, { family })),

    savePrices: (p) =>
      write(async (tx) => {
        await tx.execute(sql`update ${masterclasses} m set price = (v->>'price')::int
          from jsonb_array_elements(${JSON.stringify(p.masterclasses)}::jsonb) v
          where m.id = v->>'id'`);
        await setSettings(tx, { tariffs: p.tariffs, certificateSums: p.certificateSums });
        await tx.execute(sql`update ${settings} set value = jsonb_set(value, '{price}', to_jsonb(${p.familyPrice}::int))
          where key = 'family'`);
      }),

    saveCoworking: (coworking) => write((tx) => setSettings(tx, { coworking })),

    saveGallery: (g) =>
      write(async (tx) => {
        await setSettings(tx, { galleryCategories: g.categories });
        await replaceGalleryItems(tx, g.items);
      }),

    saveReviews: (r) => write((tx) => replaceReviews(tx, r)),

    saveSeo: (seo) => write((tx) => setSettings(tx, { seo })),

    async listUploads() {
      const rows = await db.select({ url: uploads.url }).from(uploads).orderBy(desc(uploads.createdAt));
      return rows.map((r) => r.url);
    },

    async addUpload(url) {
      await db.insert(uploads).values({ url }).onConflictDoNothing();
    },

    // Последняя копия в snapshots — данные после последнего изменения, предпоследняя — до него.
    // Отмена возвращает предпоследнюю и удаляет последнюю, так что повторная отмена идёт дальше в прошлое.
    // Если данные менялись в обход админки (например, db:seed), последняя копия с ними не совпадает — отменять нельзя.

    async lastChange() {
      const current = JSON.stringify(await loadSiteData(db));
      const [r] = rowsOf<{ id: number; at: string | Date; current: boolean; prev: number | null; changed: (keyof SiteData)[] }>(
        await db.execute(sql`select a.id, a.created_at as at, a.data = ${current}::jsonb as current, b.id as prev,
          (select coalesce(json_agg(k), '[]') from jsonb_object_keys(a.data) k where a.data -> k is distinct from b.data -> k) as changed
          from snapshots a
          left join lateral (select id, data from snapshots where id < a.id order by id desc limit 1) b on true
          order by a.id desc limit 1`),
      );
      if (!r || !r.current || r.prev === null) return null;
      return { id: r.id, at: new Date(r.at).toISOString(), sections: r.changed };
    },

    async undo(id) {
      return db.transaction(async (tx) => {
        const current = JSON.stringify(await loadSiteData(tx));
        const rows = rowsOf<{ id: number; data: SiteData; current: boolean }>(
          await tx.execute(sql`select id, data, data = ${current}::jsonb as current from snapshots order by id desc limit 2 for update`),
        );
        if (rows.length < 2 || rows[0].id !== id || !rows[0].current) return false;
        await importSiteData(tx, rows[1].data);
        await tx.delete(snapshots).where(eq(snapshots.id, id));
        return true;
      });
    },

    async reset() {
      throw new Error("Сброс к исходным данным доступен только в демо-режиме");
    },
  };
}
