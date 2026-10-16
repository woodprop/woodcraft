"use server";

import { cookies } from "next/headers";
import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { repo } from "@/lib/admin";
import { requireAdmin } from "@/lib/admin/auth";
import { ADMIN_COOKIE, adminPassword, sessionToken } from "@/lib/admin/session";
import { storeImage, type Upload } from "@/lib/admin/storage";
import {
  checkCoworking,
  checkFamily,
  checkGallery,
  checkMasterclass,
  checkPrices,
  checkReviews,
  checkSeo,
  type Checked,
  type FieldErrors,
} from "@/lib/admin/validate";
import { CONTENT_TAG } from "@/lib/content";

export type SaveResult = { ok: true } | { ok: false; errors: FieldErrors; message?: string };

/** После любого сохранения: сбросить кэш сайта и обновить страницы админки */
function published() {
  updateTag(CONTENT_TAG);
  revalidatePath("/");
  revalidatePath("/admin", "layout");
}

async function save<T>(checked: Checked<T>, write: (v: T) => Promise<void>): Promise<SaveResult> {
  if (!checked.ok) return { ok: false, errors: checked.errors };
  try {
    await write(checked.value);
  } catch (e) {
    console.error("Ошибка сохранения в БД:", e);
    return { ok: false, errors: {}, message: "Не удалось сохранить: база данных недоступна. Попробуйте ещё раз через минуту" };
  }
  published();
  return { ok: true };
}

/** фото с сайта — только из public/images, Blob или (в демо-режиме) data URL */
const checkOpts = () => ({ allowDataUrl: repo.demo });

/* ---------- Вход ---------- */

export type LoginState = { error?: string };

export async function login(_: LoginState, form: FormData): Promise<LoginState> {
  const pw = adminPassword();
  if (!pw) return { error: "Вход не настроен: задайте ADMIN_PASSWORD в переменных окружения." };
  if (String(form.get("password") ?? "") !== pw) {
    // небольшая задержка — от перебора пароля
    await new Promise((r) => setTimeout(r, 600));
    return { error: "Неверный пароль" };
  }
  (await cookies()).set(ADMIN_COOKIE, await sessionToken(pw), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  redirect("/admin");
}

export async function logout() {
  (await cookies()).delete(ADMIN_COOKIE);
  redirect("/admin/login");
}

/* ---------- Мероприятия ---------- */

export async function saveMasterclass(input: unknown): Promise<SaveResult> {
  await requireAdmin();
  return save(checkMasterclass(input, checkOpts()), (mc) => repo.saveMasterclass(mc));
}

export async function deleteMasterclass(id: string) {
  await requireAdmin();
  await repo.deleteMasterclass(String(id));
  published();
  redirect("/admin/events");
}

export async function moveMasterclass(id: string, dir: -1 | 1) {
  await requireAdmin();
  const ids = (await repo.load()).masterclasses.map((m) => m.id);
  const i = ids.indexOf(id);
  const j = i + (dir < 0 ? -1 : 1);
  if (i < 0 || j < 0 || j >= ids.length) return;
  [ids[i], ids[j]] = [ids[j], ids[i]];
  await repo.reorderMasterclasses(ids);
  published();
}

export async function setMasterclassHidden(id: string, hidden: boolean) {
  await requireAdmin();
  await repo.setMasterclassHidden(String(id), hidden === true);
  published();
}

export async function saveFamily(input: unknown): Promise<SaveResult> {
  await requireAdmin();
  const { family } = await repo.load();
  return save(checkFamily(input, family.price), (f) => repo.saveFamily(f));
}

/* ---------- Остальные разделы ---------- */

export async function savePrices(input: unknown): Promise<SaveResult> {
  await requireAdmin();
  return save(checkPrices(input), (p) => repo.savePrices(p));
}

export async function saveCoworking(input: unknown): Promise<SaveResult> {
  await requireAdmin();
  return save(checkCoworking(input), (s) => repo.saveCoworking(s));
}

export async function saveGallery(input: unknown): Promise<SaveResult> {
  await requireAdmin();
  return save(checkGallery(input, checkOpts()), (g) => repo.saveGallery(g));
}

/* ---------- Фото ---------- */

export async function uploadImage(form: FormData): Promise<Upload> {
  await requireAdmin();
  const file = form.get("file");
  if (!(file instanceof File)) return { ok: false, message: "Файл не получен" };
  try {
    const res = await storeImage(file, repo.demo);
    // фото из Blob запоминаем для «Выбрать из загруженных»; data URL (демо) и так лежит в данных
    if (res.ok && !res.src.startsWith("data:")) await repo.addUpload(res.src);
    return res;
  } catch (e) {
    console.error("Ошибка загрузки фото:", e);
    return { ok: false, message: "Не удалось загрузить фото. Попробуйте ещё раз" };
  }
}

export async function saveReviews(input: unknown): Promise<SaveResult> {
  await requireAdmin();
  return save(checkReviews(input), (r) => repo.saveReviews(r));
}

export async function saveSeo(input: unknown): Promise<SaveResult> {
  await requireAdmin();
  return save(checkSeo(input), (s) => repo.saveSeo(s));
}

/** Демо-режим: вернуть все данные к исходным из JSON */
export async function resetDemo() {
  await requireAdmin();
  if (!repo.demo) return;
  await repo.reset();
  published();
}
