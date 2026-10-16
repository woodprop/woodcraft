import "server-only";

import type { SiteData } from "@/lib/types";
import type { ContentRepo } from "./repo";
import { seedData as seed } from "./seedData";

// Держим данные в globalThis: модули в dev перезагружаются (HMR),
// а изменения из админки должны жить до перезапуска сервера.
type Snapshot = { id: number; at: string; data: SiteData };
const g = globalThis as typeof globalThis & { __woodcraftDb?: SiteData; __woodcraftUploads?: string[]; __woodcraftHistory?: Snapshot[] };
const db = () => (g.__woodcraftDb ??= seed());

const clone = <T,>(v: T): T => structuredClone(v);

/** копии данных после каждого изменения — как snapshots в БД (последние 30) */
const history = () => (g.__woodcraftHistory ??= []);
function snap() {
  const h = history();
  h.push({ id: (h.at(-1)?.id ?? 0) + 1, at: new Date().toISOString(), data: clone(db()) });
  if (h.length > 30) h.shift();
}

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
    snap();
  },
  async deleteMasterclass(id) {
    db().masterclasses = db().masterclasses.filter((m) => m.id !== id);
    snap();
  },
  async reorderMasterclasses(ids) {
    const list = db().masterclasses;
    const pos = (id: string) => {
      const i = ids.indexOf(id);
      return i < 0 ? Infinity : i;
    };
    db().masterclasses = [...list].sort((a, b) => pos(a.id) - pos(b.id));
    snap();
  },
  async setMasterclassHidden(id, hidden) {
    const mc = db().masterclasses.find((m) => m.id === id);
    if (mc) mc.hidden = hidden;
    snap();
  },
  async saveFamily(family) {
    db().family = clone(family);
    snap();
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
    snap();
  },
  async saveCoworking(s) {
    db().coworking = clone(s);
    snap();
  },
  async saveGallery(gal) {
    db().gallery = clone(gal);
    snap();
  },
  async saveReviews(r) {
    db().reviews = clone(r);
    snap();
  },
  async saveSeo(s) {
    db().seo = clone(s);
    snap();
  },
  async listUploads() {
    return [...(g.__woodcraftUploads ?? [])];
  },
  async addUpload(url) {
    g.__woodcraftUploads = [url, ...(g.__woodcraftUploads ?? []).filter((u) => u !== url)];
  },
  async lastChange() {
    const [prev, last] = history().slice(-2);
    if (!last || !prev) return null;
    const sections = (Object.keys(last.data) as (keyof SiteData)[]).filter(
      (k) => JSON.stringify(last.data[k]) !== JSON.stringify(prev.data[k]),
    );
    return { id: last.id, at: last.at, sections };
  },
  async undo(id) {
    const h = history();
    if (h.length < 2 || h.at(-1)!.id !== id) return false;
    h.pop();
    g.__woodcraftDb = clone(h.at(-1)!.data);
    return true;
  },
  async reset() {
    g.__woodcraftDb = seed();
    g.__woodcraftHistory = [];
  },
};
