import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { repo } from "./admin";
import { formatHours, tbilisiToday } from "./format";
import { fillPrices, getPrices } from "./pricing";
import type { Content, Locale, Session } from "./types";

import masters from "@/content/ru/masters.json";
import faq from "@/content/ru/faq.json";
import settings from "@/content/ru/settings.json";

/** Тег кэша контента: админка сбрасывает его после каждого сохранения */
export const CONTENT_TAG = "content";

/** только будущие даты, по порядку */
function upcoming(sessions: Session[], today: string) {
  return sessions.filter((s) => s.start.slice(0, 10) >= today).sort((a, b) => a.start.localeCompare(b.start));
}

/**
 * Единая точка доступа к контенту сайта.
 * Редактируемые данные берутся из хранилища админки (src/lib/admin),
 * остальное (мастера, FAQ, контакты) — из JSON в src/content/<locale>/.
 * Результат кэшируется; сохранение в админке сбрасывает кэш по тегу CONTENT_TAG.
 * Кэш живёт не дольше часа, чтобы прошедшие даты исчезали сами.
 */
export async function getContent(locale: Locale = "ru"): Promise<Content> {
  "use cache";
  cacheTag(CONTENT_TAG);
  cacheLife("hours");
  void locale;

  const data = await repo.load();
  const today = tbilisiToday();
  const visible = data.masterclasses.filter((m) => !m.hidden);
  const prices = getPrices(data, visible);

  return {
    contacts: settings.contacts,
    masterclasses: visible.map((m, i) => {
      const d = formatHours(m.hours);
      return {
        id: m.id,
        num: String(i + 1).padStart(2, "0"),
        title: m.title,
        desc: m.desc,
        about: m.about,
        duration: d.long,
        durationShort: d.short,
        price: m.price,
        capacity: m.capacity,
        image: m.image,
        sessions: upcoming(m.sessions, today),
      };
    }),
    tariffs: data.tariffs,
    gallery: { categories: data.gallery.categories, items: data.gallery.items.filter((g) => !g.hidden) },
    reviews: data.reviews
      .filter((r) => !r.hidden)
      .map((r) => ({ id: r.id, name: r.name, initial: r.name.trim().charAt(0).toUpperCase(), format: r.format, text: r.text, made: r.made })),
    masters,
    faq,
    coworking: data.coworking,
    prices,
    seo: { title: fillPrices(data.seo.title, prices), description: fillPrices(data.seo.description, prices) },
    booking: {
      familyProducts: data.family.products,
      familySessions: upcoming(data.family.sessions, today),
      familyPrice: data.family.price,
      corporateSizes: settings.booking.corporateSizes,
      corporateProducts: settings.booking.corporateProducts,
      certificateSums: data.certificateSums,
      certificateFormats: settings.booking.certificateFormats,
    },
  };
}
