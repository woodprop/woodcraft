// Хранилище контента в Postgres (Supabase).
// Без "server-only": loadSiteData и importSiteData нужны и скрипту scripts/seed.ts.

import { asc, eq, sql } from "drizzle-orm";
import type { Db } from "@/lib/db/client";
import { galleryItems, masterclassSessions, masterclasses, reviews, settings, snapshots, type Settings } from "@/lib/db/schema";
import type { GalleryItem, MasterclassRec, ReviewRec, Session, SiteData } from "@/lib/types";
import type { ContentRepo } from "./repo";

/** сколько последних копий данных хранить в snapshots */
const SNAPSHOTS_KEPT = 30;

type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];
type Exec = Db | Tx;

const SETTING_KEYS = ["tariffs", "family", "certificateSums", "coworking", "galleryCategories", "seo"] as const satisfies (keyof Settings)[];

// Postgres отдаёт "2026-10-24 12:00:00" и "14:00:00", сайт ждёт "2026-10-24T12:00" и "14:00"
const toStart = (v: string) => v.slice(0, 16).replace(" ", "T");
const toTime = (v: string) => v.slice(0, 5);

/* ---------- Чтение ---------- */

export async function loadSiteData(db: Exec): Promise<SiteData> {
  const [mcRows, sessionRows, galleryRows, reviewRows, settingRows] = await Promise.all([
    db.select().from(masterclasses).orderBy(asc(masterclasses.position)),
    db.select().from(masterclassSessions).orderBy(asc(masterclassSessions.start)),
    db.select().from(galleryItems).orderBy(asc(galleryItems.position)),
    db.select().from(reviews).orderBy(asc(reviews.position)),
    db.select().from(settings),
  ]);

  const s = Object.fromEntries(settingRows.map((r) => [r.key, r.value])) as Partial<Settings>;
  const missing = SETTING_KEYS.filter((k) => s[k] === undefined);
  if (missing.length) throw new Error(`В базе нет настроек: ${missing.join(", ")}. Заполните её: npm run db:seed`);

  const sessions = new Map<string, Session[]>();
  for (const r of sessionRows) {
    const list = sessions.get(r.masterclassId) ?? [];
    list.push({ start: toStart(r.start), end: toTime(r.end), seatsLeft: r.seatsLeft });
    sessions.set(r.masterclassId, list);
  }

  return {
    masterclasses: mcRows.map(
      (r): MasterclassRec => ({
        id: r.id,
        title: r.title,
        desc: r.desc,
        about: r.about,
        hours: r.hours,
        price: r.price,
        capacity: r.capacity,
        image: r.image,
        sessions: sessions.get(r.id) ?? [],
        ...(r.hidden && { hidden: true }),
      }),
    ),
    tariffs: s.tariffs!,
    family: s.family!,
    certificateSums: s.certificateSums!,
    coworking: s.coworking!,
    gallery: {
      categories: s.galleryCategories!,
      items: galleryRows.map(
        (r): GalleryItem => ({
          id: r.id,
          category: r.category,
          title: r.title,
          sub: r.sub,
          image: r.image,
          ...(r.hidden && { hidden: true }),
        }),
      ),
    },
    reviews: reviewRows.map(
      (r): ReviewRec => ({
        id: r.id,
        name: r.name,
        format: r.format,
        text: r.text,
        made: r.made,
        ...(r.hidden && { hidden: true }),
      }),
    ),
    seo: s.seo!,
  };
}

/* ---------- Запись ---------- */

async function setSetting<K extends keyof Settings>(db: Exec, key: K, value: Settings[K]) {
  await db.insert(settings).values({ key, value }).onConflictDoUpdate({ target: settings.key, set: { value } });
}

async function getSetting<K extends keyof Settings>(db: Exec, key: K): Promise<Settings[K]> {
  const [row] = await db.select().from(settings).where(eq(settings.key, key));
  if (!row) throw new Error(`В базе нет настройки ${key}. Заполните её: npm run db:seed`);
  return row.value as Settings[K];
}

async function writeMasterclass(db: Exec, mc: MasterclassRec, position: number) {
  const row = {
    id: mc.id,
    position,
    title: mc.title,
    desc: mc.desc,
    about: mc.about,
    hours: mc.hours,
    price: mc.price,
    capacity: mc.capacity,
    image: mc.image,
    hidden: mc.hidden === true,
  };
  await db.insert(masterclasses).values(row).onConflictDoUpdate({ target: masterclasses.id, set: row });
  await db.delete(masterclassSessions).where(eq(masterclassSessions.masterclassId, mc.id));
  if (mc.sessions.length) {
    await db
      .insert(masterclassSessions)
      .values(mc.sessions.map((x) => ({ masterclassId: mc.id, start: x.start, end: x.end, seatsLeft: x.seatsLeft })));
  }
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
  await setSetting(db, "tariffs", data.tariffs);
  await setSetting(db, "family", data.family);
  await setSetting(db, "certificateSums", data.certificateSums);
  await setSetting(db, "coworking", data.coworking);
  await setSetting(db, "galleryCategories", data.gallery.categories);
  await setSetting(db, "seo", data.seo);
}

/* ---------- Репозиторий для админки ---------- */

export function createDbRepo(db: Db): ContentRepo {
  /** изменение в транзакции; в той же транзакции — копия всех данных в snapshots */
  async function write(fn: (tx: Tx) => Promise<unknown>) {
    await db.transaction(async (tx) => {
      await fn(tx);
      await tx.insert(snapshots).values({ data: await loadSiteData(tx) });
      await tx
        .delete(snapshots)
        .where(sql`${snapshots.id} not in (select ${snapshots.id} from ${snapshots} order by ${snapshots.id} desc limit ${SNAPSHOTS_KEPT})`);
    });
  }

  return {
    demo: false,
    load: () => loadSiteData(db),

    saveMasterclass: (mc) =>
      write(async (tx) => {
        const [cur] = await tx.select({ position: masterclasses.position }).from(masterclasses).where(eq(masterclasses.id, mc.id));
        let position = cur?.position;
        if (position === undefined) {
          // новый мастер-класс — в конец списка
          const [{ max }] = await tx.select({ max: sql<number | null>`max(${masterclasses.position})` }).from(masterclasses);
          position = max === null ? 0 : Number(max) + 1;
        }
        await writeMasterclass(tx, mc, position);
      }),

    deleteMasterclass: (id) => write((tx) => tx.delete(masterclasses).where(eq(masterclasses.id, id))),

    reorderMasterclasses: (ids) =>
      write(async (tx) => {
        for (const [position, id] of ids.entries()) await tx.update(masterclasses).set({ position }).where(eq(masterclasses.id, id));
      }),

    setMasterclassHidden: (id, hidden) => write((tx) => tx.update(masterclasses).set({ hidden }).where(eq(masterclasses.id, id))),

    saveFamily: (family) => write((tx) => setSetting(tx, "family", family)),

    savePrices: (p) =>
      write(async (tx) => {
        for (const { id, price } of p.masterclasses) await tx.update(masterclasses).set({ price }).where(eq(masterclasses.id, id));
        await setSetting(tx, "tariffs", p.tariffs);
        await setSetting(tx, "family", { ...(await getSetting(tx, "family")), price: p.familyPrice });
        await setSetting(tx, "certificateSums", p.certificateSums);
      }),

    saveCoworking: (s) => write((tx) => setSetting(tx, "coworking", s)),

    saveGallery: (g) =>
      write(async (tx) => {
        await setSetting(tx, "galleryCategories", g.categories);
        await replaceGalleryItems(tx, g.items);
      }),

    saveReviews: (r) => write((tx) => replaceReviews(tx, r)),

    saveSeo: (s) => write((tx) => setSetting(tx, "seo", s)),

    async reset() {
      throw new Error("Сброс к исходным данным доступен только в демо-режиме");
    },
  };
}
