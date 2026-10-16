// Исходные данные из src/content/ru/*.json: с них стартует mock и ими заполняется БД (npm run db:seed).

import masterclasses from "@/content/ru/masterclasses.json";
import gallery from "@/content/ru/gallery.json";
import reviews from "@/content/ru/reviews.json";
import settings from "@/content/ru/settings.json";
import type { SiteData } from "@/lib/types";

export function seedData(): SiteData {
  return structuredClone({
    masterclasses,
    tariffs: settings.tariffs,
    family: settings.family,
    certificateSums: settings.certificateSums,
    coworking: settings.coworking,
    gallery,
    reviews,
    seo: settings.seo,
  });
}
