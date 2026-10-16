import "server-only";

import { list, put } from "@vercel/blob";
import { randomUUID } from "node:crypto";

/** Папка загруженных фото в Vercel Blob */
const PREFIX = "uploads/";
/** фото сжимается в браузере до ~1,5 МБ; сервер принимает с запасом */
export const MAX_UPLOAD = 2_000_000;
const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

/** Фото хранятся в Vercel Blob, если задан BLOB_READ_WRITE_TOKEN; иначе — data URL прямо в данных (демо) */
export const blobEnabled = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);

export type Upload = { ok: true; src: string } | { ok: false; message: string };

export async function storeImage(file: File, allowDataUrl: boolean): Promise<Upload> {
  const ext = TYPES[file.type];
  if (!ext) return { ok: false, message: "Нужен файл JPG, PNG или WebP" };
  if (file.size > MAX_UPLOAD) return { ok: false, message: "Фото слишком большое — максимум 2 МБ" };

  if (blobEnabled()) {
    const blob = await put(`${PREFIX}${randomUUID()}.${ext}`, file, { access: "public", contentType: file.type });
    return { ok: true, src: blob.url };
  }
  if (!allowDataUrl) return { ok: false, message: "Хранилище фото не настроено: задайте BLOB_READ_WRITE_TOKEN" };
  const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");
  return { ok: true, src: `data:${file.type};base64,${base64}` };
}

/** Все загруженные фото, новые первыми */
export async function listUploads(): Promise<string[]> {
  if (!blobEnabled()) return [];
  const found: { url: string; uploadedAt: Date }[] = [];
  let cursor: string | undefined;
  do {
    const page = await list({ prefix: PREFIX, cursor, limit: 1000 });
    found.push(...page.blobs);
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return found.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime()).map((b) => b.url);
}
