import "server-only";

import type { Content, Locale } from "./types";

import masterclasses from "@/content/ru/masterclasses.json";
import gallery from "@/content/ru/gallery.json";
import reviews from "@/content/ru/reviews.json";
import masters from "@/content/ru/masters.json";
import faq from "@/content/ru/faq.json";
import settings from "@/content/ru/settings.json";

const sources: Record<Locale, Content> = {
  ru: {
    contacts: settings.contacts,
    tariffs: settings.tariffs,
    booking: settings.booking,
    masterclasses,
    gallery,
    reviews,
    masters,
    faq,
  },
};

/**
 * Единая точка доступа к контенту.
 * Сейчас данные лежат в JSON (src/content/<locale>/*.json).
 * Когда появится админка с БД — заменить реализацию этой функции,
 * компоненты менять не придётся.
 */
export async function getContent(locale: Locale = "ru"): Promise<Content> {
  return sources[locale];
}
