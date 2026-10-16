import "server-only";

import { readdir } from "node:fs/promises";
import path from "node:path";
import type { SiteData } from "@/lib/types";

const PUBLIC = path.join(process.cwd(), "public");

async function walk(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
  const nested = await Promise.all(
    entries.map((e) => {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) return walk(full);
      return /\.(jpe?g|png|webp|avif)$/i.test(e.name) ? [full] : [];
    }),
  );
  return nested.flat();
}

/**
 * Фото, из которых можно выбирать в админке: файлы из public/images
 * и фото, загруженные через админку (в демо-режиме — data URL в памяти).
 */
export async function imageLibrary(data: SiteData) {
  const files = (await walk(path.join(PUBLIC, "images"))).map((f) => "/" + path.relative(PUBLIC, f).split(path.sep).join("/"));
  const used = [...data.masterclasses.map((m) => m.image.src), ...data.gallery.items.map((g) => g.image.src)];
  const uploaded = used.filter((src) => src.startsWith("data:"));
  return [...new Set([...uploaded, ...files.sort()])];
}
