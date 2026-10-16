import "server-only";

import { Composer, InlineKeyboard } from "grammy";
import { repo } from "@/lib/admin";
import { uid } from "@/lib/admin/drafts";
import { MAX_UPLOAD, storeImage } from "@/lib/admin/storage";
import { checkGallery } from "@/lib/admin/validate";
import { botConfig } from "./config";
import { plural } from "@/lib/format";
import type { GalleryItem, SiteData } from "@/lib/types";
import { checkOpts, commit } from "./save";
import { flowAt, type BotContext, type FlowAt, type Steps } from "./state";
import { byRef, cancelKb, esc, paged, pagerRow, photoUrl, ref, show, stale, warn, withNote, type Screen } from "./ui";

// Галерея: добавить работу (фото → категория → название → подпись), скрыть, удалить.
// Кнопки: g — раздел; g:add; g:l:<стр.> — список; g:i:<ref> — работа; f:gc:<ref категории>, f:gskip — внутри диалога.

type Gallery = SiteData["gallery"];

/** категория "all" — это фильтр «Все» на сайте, работам её не назначают */
const realCategories = (g: Gallery) => g.categories.filter((c) => c.id !== "all");
const catLabel = (g: Gallery, id: string) => g.categories.find((c) => c.id === id)?.label ?? "без категории";

function menuScreen(g: Gallery): Screen {
  const hidden = g.items.filter((x) => x.hidden).length;
  return {
    text: [
      "📷 <b>Галерея</b>",
      `На сайте ${g.items.length - hidden} ${plural(g.items.length - hidden, ["работа", "работы", "работ"])}${hidden ? `, скрыто ${hidden}` : ""}.`,
      "",
      "Чтобы добавить работу, просто пришлите фото. Подпись к фото станет названием работы.",
    ].join("\n"),
    kb: new InlineKeyboard().text("➕ Добавить фото", "g:add").row().text("🗂 Все работы", "g:l:0").row().text("← Меню", "m"),
  };
}

function listScreen(g: Gallery, page: number): Screen {
  const p = paged(g.items, page);
  const kb = new InlineKeyboard();
  for (const x of p.items) kb.text(`${x.hidden ? "🙈 " : ""}${x.title}`, `g:i:${ref(x.id)}`).row();
  pagerRow(kb, p.page, p.pages, (n) => `g:l:${n}`);
  kb.text("← Галерея", "g");
  return { text: "🗂 <b>Работы в галерее</b> — в том порядке, как на сайте.\n🙈 — скрыта с сайта.", kb };
}

function itemScreen(g: Gallery, x: GalleryItem): Screen {
  const r = `g:i:${ref(x.id)}`;
  const page = Math.floor(g.items.indexOf(x) / 8);
  return {
    text: [
      `<b>${esc(x.title)}</b>`,
      ...(x.sub ? [esc(x.sub)] : []),
      `Категория: ${esc(catLabel(g, x.category))}`,
      x.hidden ? "🙈 Скрыта с сайта" : "На сайте",
    ].join("\n"),
    preview: photoUrl(x.image.src),
    kb: new InlineKeyboard()
      .text(x.hidden ? "👁 Показать на сайте" : "🙈 Скрыть с сайта", `${r}:h`)
      .row()
      .text("🗑 Удалить", `${r}:del`)
      .row()
      .text("← К списку", `g:l:${page}`),
  };
}

export const gallery = new Composer<BotContext>();

async function openMenu(ctx: BotContext) {
  await show(ctx, menuScreen((await repo.load()).gallery));
}

gallery.command("gallery", openMenu);
gallery.callbackQuery("g", openMenu);

gallery.callbackQuery(/^g:l:(\d+)$/, async (ctx) => {
  await show(ctx, listScreen((await repo.load()).gallery, Number(ctx.match[1])));
});

async function loadItem(ctx: BotContext, r: string) {
  const g = (await repo.load()).gallery;
  const x = byRef(g.items, r);
  if (!x) await show(ctx, withNote(listScreen(g, 0), "Этой работы уже нет."));
  else return { g, x };
}

const save = (ctx: BotContext, g: Gallery) => commit(ctx, checkGallery(g, checkOpts()), (v) => repo.saveGallery(v));

gallery.callbackQuery(/^g:i:(\w+)$/, async (ctx) => {
  const r = await loadItem(ctx, ctx.match[1]);
  if (r) await show(ctx, itemScreen(r.g, r.x));
});

gallery.callbackQuery(/^g:i:(\w+):h$/, async (ctx) => {
  const r = await loadItem(ctx, ctx.match[1]);
  if (!r) return;
  const x = { ...r.x, hidden: !r.x.hidden };
  const g = { ...r.g, items: r.g.items.map((i) => (i.id === x.id ? x : i)) };
  if (await save(ctx, g)) await show(ctx, withNote(itemScreen(g, x), x.hidden ? "🙈 Скрыта с сайта." : "👁 Снова на сайте."));
});

gallery.callbackQuery(/^g:i:(\w+):del$/, async (ctx) => {
  const r = await loadItem(ctx, ctx.match[1]);
  if (!r) return;
  const at = `g:i:${ctx.match[1]}`;
  await show(ctx, {
    text: `Удалить «${esc(r.x.title)}» из галереи?\nЕсли нужно только убрать с сайта на время — лучше скрыть.`,
    kb: new InlineKeyboard().text("🗑 Да, удалить", `${at}:del!`).row().text("Нет", at),
  });
});

gallery.callbackQuery(/^g:i:(\w+):del!$/, async (ctx) => {
  const r = await loadItem(ctx, ctx.match[1]);
  if (!r) return;
  const g = { ...r.g, items: r.g.items.filter((i) => i.id !== r.x.id) };
  if (await save(ctx, g)) await show(ctx, withNote(listScreen(g, 0), `🗑 «${esc(r.x.title)}» удалена.`));
});

/* ---------- Добавление ---------- */

gallery.callbackQuery("g:add", async (ctx) => {
  ctx.setFlow({ step: "g.photo" });
  await show(ctx, { text: "Пришлите фото работы. Можно сразу с подписью — она станет названием.", kb: cancelKb() });
});

/** Скачать фото из Telegram и сохранить в Vercel Blob (в демо — data URL) */
async function storePhoto(ctx: BotContext): Promise<string | null> {
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

// фото принимаем всегда: без начатого диалога (или посреди другого) — начинаем добавление работы
gallery.on(["message:photo", "message:document"], async (ctx) => {
  await ctx.replyWithChatAction("upload_photo").catch(() => {});
  const src = await storePhoto(ctx);
  if (!src) return;
  const caption = ctx.message.caption?.trim();
  const g = (await repo.load()).gallery;
  ctx.setFlow({ step: "g.cat", src, ...(caption && caption.length <= 80 && { title: caption }) });
  const kb = new InlineKeyboard();
  realCategories(g).forEach((c, i) => {
    kb.text(c.label, `f:gc:${ref(c.id)}`);
    if (i % 2 === 1) kb.row();
  });
  await show(ctx, { text: "Фото загружено. В какую категорию?", kb: cancelKb(kb.row()) });
});

const askTitle = (ctx: BotContext) =>
  show(ctx, { text: "Название работы, например «Разделочная доска из ореха» (до 80 символов):", kb: cancelKb() });

const askSub = (ctx: BotContext, title: string) =>
  show(ctx, {
    text: `<b>${esc(title)}</b>\nПодпись под названием — например «Мастер-класс · первая работа Анны». Необязательно.`,
    kb: cancelKb(new InlineKeyboard().text("Пропустить", "f:gskip")),
  });

gallery.callbackQuery(/^f:gc:(\w+)$/, async (ctx) => {
  const flow = flowAt(ctx, "g.cat");
  if (!flow) return stale(ctx);
  const cat = byRef(realCategories((await repo.load()).gallery), ctx.match[1]);
  if (!cat) return stale(ctx);
  if (flow.title) {
    ctx.setFlow({ step: "g.sub", src: flow.src, cat: cat.id, title: flow.title });
    await askSub(ctx, flow.title);
  } else {
    ctx.setFlow({ step: "g.title", src: flow.src, cat: cat.id });
    await askTitle(ctx);
  }
});

async function addItem(ctx: BotContext, flow: FlowAt<"g.sub">, sub: string) {
  const g = (await repo.load()).gallery;
  const item: GalleryItem = { id: uid("g"), category: flow.cat, title: flow.title, sub, image: { src: flow.src, alt: flow.title } };
  const next = { ...g, items: [item, ...g.items] };
  if (!(await save(ctx, next))) return;
  ctx.setFlow(null);
  await show(ctx, withNote(menuScreen(next), `✅ «${esc(flow.title)}» добавлена в галерею — первой в списке.`));
}

gallery.callbackQuery("f:gskip", async (ctx) => {
  const flow = flowAt(ctx, "g.sub");
  if (!flow) return stale(ctx);
  await addItem(ctx, flow, "");
});

export const gallerySteps: Steps = {
  "g.photo": async (ctx) => void (await warn(ctx, "Жду фото. Передумали — нажмите /cancel")),
  "g.cat": async (ctx) => void (await warn(ctx, "Выберите категорию кнопкой выше")),
  "g.title": async (ctx, text, flow) => {
    const title = text.trim();
    if (title.length > 80) return void (await warn(ctx, `Слишком длинно: ${title.length} символов из 80`));
    ctx.setFlow({ step: "g.sub", src: flow.src, cat: flow.cat, title });
    await askSub(ctx, title);
  },
  "g.sub": (ctx, text, flow) => addItem(ctx, flow, text.trim()),
};
