import "server-only";

import { repo } from "@/lib/admin";
import { MAX_UPLOAD, storeImage } from "@/lib/admin/storage";
import { botConfig } from "./config";
import type { BotContext } from "./state";
import { esc, warn } from "./ui";

/** Скачать фото из Telegram и сохранить в Vercel Blob (в демо — data URL) */
export async function storePhoto(ctx: BotContext): Promise<string | null> {
  const m = ctx.message!;
  let file: { file_id: string; file_size?: number } | undefined;
  if (m.photo?.length) {
    // размеры идут по возрастанию — берём самый большой, что влезает в лимит
    file = m.photo.filter((p) => (p.file_size ?? 0) <= MAX_UPLOAD).at(-1) ?? m.photo.at(-1);
  } else if (m.document && /^image\/(jpeg|png|webp)$/.test(m.document.mime_type ?? "")) {
    file = m.document;
  }
  if (!file) {
    await warn(ctx, "Нужно фото — JPG, PNG или WebP");
    return null;
  }
  if ((file.file_size ?? 0) > MAX_UPLOAD) {
    await warn(ctx, "Фото больше 2 МБ. Отправьте его как фото, а не файлом — Telegram сам уменьшит размер");
    return null;
  }
  try {
    const info = await ctx.api.getFile(file.file_id);
    const res = await fetch(`${botConfig()!.apiRoot}/file/bot${ctx.api.token}/${info.file_path}`);
    if (!res.ok) throw new Error(`Telegram вернул ${res.status}`);
    const up = await storeImage(new File([await res.arrayBuffer()], "photo"), repo.demo);
    if (!up.ok) {
      await warn(ctx, esc(up.message));
      return null;
    }
    if (!up.src.startsWith("data:")) await repo.addUpload(up.src);
    return up.src;
  } catch (e) {
    console.error("Бот: ошибка загрузки фото:", e);
    await warn(ctx, "Не удалось загрузить фото. Попробуйте ещё раз");
    return null;
  }
}
