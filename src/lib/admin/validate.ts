// Проверка данных из форм админки. Всё, что приходит в Server Action, считаем недоверенным:
// приводим к нужному типу, обрезаем лишнее и собираем понятные ошибки по полям.

import type {
  CoworkingSchedule,
  Family,
  GalleryCategory,
  GalleryItem,
  Img,
  MasterclassRec,
  Option,
  ReviewRec,
  Seo,
  Session,
  Tariff,
} from "@/lib/types";
import { blobHost } from "@/lib/blobHost";
import type { PricesInput } from "./repo";

/** ключ — путь к полю ("sessions.2.start"), значение — текст ошибки */
export type FieldErrors = Record<string, string>;
export type Checked<T> = { ok: true; value: T } | { ok: false; errors: FieldErrors };

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const ID = /^[a-z0-9-]{1,60}$/;
/** фото, загруженное в наш store Vercel Blob (src/lib/admin/storage.ts) */
function isBlobSrc(src: string) {
  const host = blobHost();
  return Boolean(host) && src.startsWith(`https://${host}/uploads/`) && /^https:\/\/[^/]+\/uploads\/[\w-]+\.(jpg|png|webp)$/.test(src);
}
/** загруженная картинка в демо-режиме (data URL) — не больше ~1,5 МБ */
const MAX_DATA_URL = 2_000_000;

/** allowDataUrl — принимать фото в виде data URL (только в демо-режиме, без Blob) */
export type CheckOptions = { allowDataUrl: boolean };

type Rec = Record<string, unknown>;
const isRec = (v: unknown): v is Rec => typeof v === "object" && v !== null && !Array.isArray(v);

class Checker {
  errors: FieldErrors = {};
  opts: CheckOptions;
  constructor(opts: CheckOptions = { allowDataUrl: false }) {
    this.opts = opts;
  }
  fail(path: string, msg: string) {
    this.errors[path] ??= msg;
  }
  obj(v: unknown, path: string): Rec {
    if (isRec(v)) return v;
    this.fail(path, "Неверные данные");
    return {};
  }
  arr(v: unknown, path: string, max = 500): unknown[] {
    if (Array.isArray(v) && v.length <= max) return v;
    this.fail(path, "Неверные данные");
    return [];
  }
  str(v: unknown, path: string, { required = true, max = 1000, label = "поле" } = {}): string {
    const s = typeof v === "string" ? v.trim() : "";
    if (required && !s) this.fail(path, `Заполните ${label}`);
    else if (s.length > max) this.fail(path, `Слишком длинно: максимум ${max} символов`);
    return s.slice(0, max);
  }
  num(v: unknown, path: string, { min = 0, max = 100000, step = 1, label = "число" } = {}): number {
    const n = typeof v === "number" ? v : typeof v === "string" && v.trim() ? Number(v.replace(",", ".")) : NaN;
    if (!Number.isFinite(n)) {
      this.fail(path, `Укажите ${label}`);
      return min;
    }
    if (n < min || n > max) this.fail(path, `Допустимо от ${min} до ${max}`);
    else if (Math.abs(n / step - Math.round(n / step)) > 1e-9) this.fail(path, step === 1 ? "Нужно целое число" : `Шаг — ${String(step).replace(".", ",")}`);
    return n;
  }
  bool(v: unknown) {
    return v === true;
  }
  time(v: unknown, path: string): string {
    const s = typeof v === "string" ? v : "";
    if (!TIME.test(s)) this.fail(path, "Укажите время, например 18:00");
    return s;
  }
  date(v: unknown, path: string): string {
    const s = typeof v === "string" ? v : "";
    if (!DATE.test(s)) this.fail(path, "Укажите дату");
    return s;
  }
  id(v: unknown, path: string): string {
    const s = typeof v === "string" ? v : "";
    if (!ID.test(s)) this.fail(path, "Неверный идентификатор");
    return s;
  }
  img(v: unknown, path: string, alt: string): Img {
    const o = this.obj(v, path);
    const src = typeof o.src === "string" ? o.src : "";
    const local = /^\/images\/[\w\-/]+\.(jpe?g|png|webp|avif)$/i.test(src) && !src.includes("..");
    const blob = isBlobSrc(src);
    const dataUrl =
      this.opts.allowDataUrl && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(src) && src.length <= MAX_DATA_URL;
    if (!local && !blob && !dataUrl) this.fail(path, "Выберите фото");
    const pos = typeof o.pos === "string" && /^\d{1,3}% \d{1,3}%$/.test(o.pos) ? o.pos : undefined;
    const posMobile = typeof o.posMobile === "string" && /^\d{1,3}% \d{1,3}%$/.test(o.posMobile) ? o.posMobile : undefined;
    return { src, alt: alt.slice(0, 200), ...(pos && { pos }), ...(posMobile && { posMobile }) };
  }
  sessions(v: unknown, path: string, maxSeats: number): Session[] {
    const list = this.arr(v, path, 100).map((raw, i) => {
      const p = `${path}.${i}`;
      const o = this.obj(raw, p);
      const date = this.date(o.date, `${p}.date`);
      const from = this.time(o.from, `${p}.from`);
      const end = this.time(o.end, `${p}.end`);
      if (TIME.test(from) && TIME.test(end) && end <= from) this.fail(`${p}.end`, "Конец должен быть позже начала");
      const seatsLeft = this.num(o.seatsLeft, `${p}.seatsLeft`, { min: 0, max: maxSeats, label: "свободные места" });
      return { start: `${date}T${from}`, end, seatsLeft };
    });
    list.forEach((s, i) => {
      if (list.findIndex((x) => x.start === s.start) !== i) this.fail(`${path}.${i}.from`, "Такая дата и время уже есть");
    });
    return list.sort((a, b) => a.start.localeCompare(b.start));
  }
  result<T>(value: T): Checked<T> {
    return Object.keys(this.errors).length ? { ok: false, errors: this.errors } : { ok: true, value };
  }
}

/* ---------- Мастер-классы и семейные занятия ---------- */

export function checkMasterclass(v: unknown, opts: CheckOptions): Checked<MasterclassRec> {
  const c = new Checker(opts);
  const o = c.obj(v, "");
  const title = c.str(o.title, "title", { max: 80, label: "название" });
  const capacity = c.num(o.capacity, "capacity", { min: 1, max: 20, label: "размер группы" });
  const mc: MasterclassRec = {
    id: c.id(o.id, "id"),
    title,
    desc: c.str(o.desc, "desc", { max: 160, label: "короткое описание" }),
    about: c.str(o.about, "about", { max: 1200, label: "подробное описание" }),
    hours: c.num(o.hours, "hours", { min: 0.5, max: 12, step: 0.5, label: "длительность" }),
    price: c.num(o.price, "price", { min: 0, max: 10000, label: "цену" }),
    capacity,
    image: c.img(o.image, "image", title),
    sessions: c.sessions(o.sessions, "sessions", capacity),
    ...(c.bool(o.hidden) && { hidden: true }),
  };
  return c.result(mc);
}

function checkOptions(c: Checker, v: unknown, path: string, label: string): Option[] {
  const list = c.arr(v, path, 30).map((raw, i) => {
    const o = c.obj(raw, `${path}.${i}`);
    return { id: c.id(o.id, `${path}.${i}.id`), label: c.str(o.label, `${path}.${i}.label`, { max: 60, label }) };
  });
  if (!list.length) c.fail(path, "Добавьте хотя бы один вариант");
  return list;
}

export function checkFamily(v: unknown, price: number): Checked<Family> {
  const c = new Checker();
  const o = c.obj(v, "");
  return c.result({
    price,
    products: checkOptions(c, o.products, "products", "название изделия"),
    sessions: c.sessions(o.sessions, "sessions", 20),
  });
}

/* ---------- Цены ---------- */

export function checkPrices(v: unknown): Checked<PricesInput> {
  const c = new Checker();
  const o = c.obj(v, "");
  const price = (x: unknown, p: string) => c.num(x, p, { min: 0, max: 10000, label: "цену" });

  const masterclasses = c.arr(o.masterclasses, "masterclasses", 100).map((raw, i) => {
    const m = c.obj(raw, `masterclasses.${i}`);
    return { id: c.id(m.id, `masterclasses.${i}.id`), price: price(m.price, `masterclasses.${i}.price`) };
  });

  const tariffs: Tariff[] = c.arr(o.tariffs, "tariffs", 10).map((raw, i) => {
    const t = c.obj(raw, `tariffs.${i}`);
    const p = `tariffs.${i}`;
    return {
      id: c.id(t.id, `${p}.id`),
      label: c.str(t.label, `${p}.label`, { max: 30, label: "название тарифа" }),
      price: price(t.price, `${p}.price`),
      desc: c.str(t.desc, `${p}.desc`, { max: 160, label: "описание" }),
      ...(c.bool(t.highlight) && { highlight: true }),
      ...(c.bool(t.fullDay) && { fullDay: true }),
    };
  });
  if (!tariffs.length) c.fail("tariffs", "Нужен хотя бы один тариф");

  const certificateSums: Option[] = c.arr(o.certificateSums, "certificateSums", 10).map((raw, i) => {
    const s = c.obj(raw, `certificateSums.${i}`);
    const p = `certificateSums.${i}`;
    const amount = c.num(s.price, `${p}.price`, { min: 1, max: 10000, label: "сумму" });
    return {
      id: c.id(s.id, `${p}.id`),
      label: String(amount),
      hint: c.str(s.hint, `${p}.hint`, { max: 30, label: "подпись" }),
      price: amount,
    };
  });
  if (!certificateSums.length) c.fail("certificateSums", "Нужен хотя бы один номинал");

  return c.result({ masterclasses, tariffs, familyPrice: price(o.familyPrice, "familyPrice"), certificateSums });
}

/* ---------- Коворкинг ---------- */

export function checkCoworking(v: unknown): Checked<CoworkingSchedule> {
  const c = new Checker();
  const o = c.obj(v, "");
  const weekRaw = c.arr(o.week, "week", 7);
  if (weekRaw.length !== 7) c.fail("week", "Нужно расписание на 7 дней");
  const week = weekRaw.map((raw, i) => {
    const d = c.obj(raw, `week.${i}`);
    const open = c.bool(d.open);
    const from = c.time(d.from, `week.${i}.from`);
    const to = c.time(d.to, `week.${i}.to`);
    if (open && to <= from) c.fail(`week.${i}.to`, "Закрытие должно быть позже открытия");
    return { open, from, to };
  });
  const slotTimes = [...new Set(c.arr(o.slotTimes, "slotTimes", 48).map((t, i) => c.time(t, `slotTimes.${i}`)))].sort();
  if (!slotTimes.length) c.fail("slotTimes", "Добавьте хотя бы одно время начала");
  const closedDates = c
    .arr(o.closedDates, "closedDates", 100)
    .map((raw, i) => {
      const d = c.obj(raw, `closedDates.${i}`);
      return { date: c.date(d.date, `closedDates.${i}.date`), reason: c.str(d.reason, `closedDates.${i}.reason`, { required: false, max: 60 }) };
    })
    .sort((a, b) => a.date.localeCompare(b.date));
  return c.result({
    week,
    slotTimes,
    daysAhead: c.num(o.daysAhead, "daysAhead", { min: 1, max: 60, label: "количество дней" }),
    closedDates,
  });
}

/* ---------- Галерея ---------- */

export function checkGallery(v: unknown, opts: CheckOptions): Checked<{ categories: GalleryCategory[]; items: GalleryItem[] }> {
  const c = new Checker(opts);
  const o = c.obj(v, "");
  const categories = c.arr(o.categories, "categories", 20).map((raw, i) => {
    const g = c.obj(raw, `categories.${i}`);
    return { id: c.id(g.id, `categories.${i}.id`), label: c.str(g.label, `categories.${i}.label`, { max: 30, label: "название категории" }) };
  });
  const ids = new Set(categories.map((g) => g.id));
  const items = c.arr(o.items, "items", 200).map((raw, i) => {
    const g = c.obj(raw, `items.${i}`);
    const p = `items.${i}`;
    const title = c.str(g.title, `${p}.title`, { max: 80, label: "название работы" });
    const category = typeof g.category === "string" ? g.category : "";
    if (!ids.has(category) || category === "all") c.fail(`${p}.category`, "Выберите категорию");
    return {
      id: c.id(g.id, `${p}.id`),
      category,
      title,
      sub: c.str(g.sub, `${p}.sub`, { required: false, max: 80 }),
      image: c.img(g.image, `${p}.image`, title),
      ...(c.bool(g.hidden) && { hidden: true }),
    };
  });
  return c.result({ categories, items });
}

/* ---------- Отзывы ---------- */

export function checkReviews(v: unknown): Checked<ReviewRec[]> {
  const c = new Checker();
  const list = c.arr(v, "", 200).map((raw, i) => {
    const r = c.obj(raw, `${i}`);
    return {
      id: c.id(r.id, `${i}.id`),
      name: c.str(r.name, `${i}.name`, { max: 40, label: "имя" }),
      format: c.str(r.format, `${i}.format`, { max: 30, label: "формат" }),
      text: c.str(r.text, `${i}.text`, { max: 600, label: "текст отзыва" }),
      made: c.str(r.made, `${i}.made`, { required: false, max: 60 }),
      ...(c.bool(r.hidden) && { hidden: true }),
    };
  });
  return c.result(list);
}

/* ---------- SEO ---------- */

export function checkSeo(v: unknown): Checked<Seo> {
  const c = new Checker();
  const o = c.obj(v, "");
  return c.result({
    title: c.str(o.title, "title", { max: 120, label: "заголовок" }),
    description: c.str(o.description, "description", { max: 320, label: "описание" }),
  });
}
