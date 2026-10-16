import type { Family, GalleryCategory, GalleryItem, MasterclassRec, Option, ReviewRec, Seo, SiteData, Tariff, CoworkingSchedule } from "@/lib/types";

export type PricesInput = {
  masterclasses: { id: string; price: number }[];
  tariffs: Tariff[];
  familyPrice: number;
  certificateSums: Option[];
};

/**
 * Хранилище редактируемого контента: Postgres (dbRepo.ts) или, если база
 * не настроена, mock в памяти сервера (mockRepo.ts). Выбор — в index.ts.
 */
export interface ContentRepo {
  /** демо-режим: данные в памяти, пропадут при перезапуске */
  readonly demo: boolean;
  load(): Promise<SiteData>;
  /** создать или обновить мастер-класс (новый добавляется в конец) */
  saveMasterclass(mc: MasterclassRec): Promise<void>;
  deleteMasterclass(id: string): Promise<void>;
  reorderMasterclasses(ids: string[]): Promise<void>;
  setMasterclassHidden(id: string, hidden: boolean): Promise<void>;
  saveFamily(family: Family): Promise<void>;
  savePrices(p: PricesInput): Promise<void>;
  saveCoworking(s: CoworkingSchedule): Promise<void>;
  saveGallery(g: { categories: GalleryCategory[]; items: GalleryItem[] }): Promise<void>;
  saveReviews(r: ReviewRec[]): Promise<void>;
  saveSeo(s: Seo): Promise<void>;
  /** вернуть исходные данные (только в демо-режиме) */
  reset(): Promise<void>;
}
