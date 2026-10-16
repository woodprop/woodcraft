import "server-only";

import { revalidatePath, revalidateTag } from "next/cache";
import { repo } from "@/lib/admin";
import type { Checked } from "@/lib/admin/validate";
import { CONTENT_TAG } from "@/lib/content";
import type { BotContext } from "./state";
import { esc, warn } from "./ui";

/**
 * После любого сохранения: сбросить кэш сайта и страниц админки.
 * updateTag из actions.ts работает только в Server Actions, в route handler — revalidateTag
 * с expire: 0 (следующий запрос ждёт свежие данные, как после updateTag).
 */
export function published() {
  revalidateTag(CONTENT_TAG, { expire: 0 });
  revalidatePath("/");
  revalidatePath("/admin", "layout");
}

/** фото — только из public/images, Blob или (в демо-режиме) data URL — как в админке */
export const checkOpts = () => ({ allowDataUrl: repo.demo });

/** Проверенные данные — в хранилище; ошибку проверки или базы показать админу. true — сохранено. */
export async function commit<T>(ctx: BotContext, checked: Checked<T>, write: (v: T) => Promise<void>) {
  if (!checked.ok) {
    await warn(ctx, esc(Object.values(checked.errors)[0] ?? "Неверные данные"));
    return false;
  }
  return run(ctx, () => write(checked.value));
}

/** Изменение без проверки формы (скрыть/показать) — с той же обработкой ошибок базы */
export async function run(ctx: BotContext, write: () => Promise<unknown>) {
  try {
    await write();
  } catch (e) {
    console.error("Бот: ошибка сохранения в БД:", e);
    await warn(ctx, "Не удалось сохранить: база данных недоступна. Попробуйте ещё раз через минуту");
    return false;
  }
  published();
  return true;
}
