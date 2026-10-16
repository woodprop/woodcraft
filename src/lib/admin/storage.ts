import "server-only";

import { list, put } from "@vercel/blob";
import { randomUUID } from "node:crypto";

/** Папка загруженных фото в Vercel Blob */
const PREFIX = "uploads/";
/** фото сжимается в браузере до ~1 МБ; сервер принимает с запасом */
export const MAX_UPLOAD = 2_000_000;
const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

/** Тип по первым байтам файла — MIME-тип из запроса присылает клиент, ему не верим */
function sniff(b: Uint8Array): string | undefined {
  const at = (i: number, ...bytes: number[]) => bytes.every((x, k) => b[i + k] === x);
  if (at(0, 0xff, 0xd8, 0xff)) return "image/jpeg";
  if (at(0, 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return "image/png";
  if (at(0, 0x52, 0x49, 0x46, 0x46) && at(8, 0x57, 0x45, 0x42, 0x50)) return "image/webp";
}

/**
 * Фото хранятся в Vercel Blob, если store подключён к проекту; иначе — data URL прямо в данных (демо).
 * Новые store подключаются через OIDC: Vercel задаёт BLOB_STORE_ID, а токен (VERCEL_OIDC_TOKEN)
 * SDK берёт сам. У старых store — постоянный BLOB_READ_WRITE_TOKEN.
 */
export const blobEnabled = () => Boolean(process.env.BLOB_STORE_ID || process.env.BLOB_READ_WRITE_TOKEN);

export type Upload = { ok: true; src: string } | { ok: false; message: string };

export async function storeImage(file: File, allowDataUrl: boolean): Promise<Upload> {
  if (file.size > MAX_UPLOAD) return { ok: false, message: "Фото слишком большое — максимум 2 МБ" };
  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = sniff(bytes);
  if (!type) return { ok: false, message: "Нужен файл JPG, PNG или WebP" };

  if (blobEnabled()) {
    const blob = await put(`${PREFIX}${randomUUID()}.${TYPES[type]}`, Buffer.from(bytes), { access: "public", contentType: type });
    return { ok: true, src: blob.url };
  }
  if (!allowDataUrl) return { ok: false, message: "Хранилище фото не настроено: подключите Vercel Blob к проекту" };
  return { ok: true, src: `data:${type};base64,${Buffer.from(bytes).toString("base64")}` };
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
