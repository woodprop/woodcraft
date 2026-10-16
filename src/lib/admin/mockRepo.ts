import "server-only";

import type { SiteData } from "@/lib/types";
import type { ContentRepo } from "./repo";
import { seedData as seed } from "./seedData";

// Держим данные в globalThis: модули в dev перезагружаются (HMR),
// а изменения из админки должны жить до перезапуска сервера.
const g = globalThis as typeof globalThis & { __woodcraftDb?: SiteData };
const db = () => (g.__woodcraftDb ??= seed());

const clone = <T,>(v: T): T => structuredClone(v);

export const mockRepo: ContentRepo = {
  demo: true,
  async load() {
    return clone(db());
  },
  async saveMasterclass(mc) {
    const list = db().masterclasses;
    const i = list.findIndex((m) => m.id === mc.id);
    if (i >= 0) list[i] = clone(mc);
    else list.push(clone(mc));
  },
  async deleteMasterclass(id) {
    db().masterclasses = db().masterclasses.filter((m) => m.id !== id);
  },
  async reorderMasterclasses(ids) {
    const list = db().masterclasses;
    const pos = (id: string) => {
      const i = ids.indexOf(id);
      return i < 0 ? Infinity : i;
    };
    db().masterclasses = [...list].sort((a, b) => pos(a.id) - pos(b.id));
  },
  async setMasterclassHidden(id, hidden) {
    const mc = db().masterclasses.find((m) => m.id === id);
    if (mc) mc.hidden = hidden;
  },
  async saveFamily(family) {
    db().family = clone(family);
  },
  async savePrices(p) {
    const d = db();
    for (const { id, price } of p.masterclasses) {
      const mc = d.masterclasses.find((m) => m.id === id);
      if (mc) mc.price = price;
    }
    d.tariffs = clone(p.tariffs);
    d.family.price = p.familyPrice;
    d.certificateSums = clone(p.certificateSums);
  },
  async saveCoworking(s) {
    db().coworking = clone(s);
  },
  async saveGallery(gal) {
    db().gallery = clone(gal);
  },
  async saveReviews(r) {
    db().reviews = clone(r);
  },
  async saveSeo(s) {
    db().seo = clone(s);
  },
  async reset() {
    g.__woodcraftDb = seed();
  },
};
