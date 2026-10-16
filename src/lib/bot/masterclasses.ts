import "server-only";

import { Composer, InlineKeyboard } from "grammy";
import { repo } from "@/lib/admin";
import { slugify, toDraft } from "@/lib/admin/drafts";
import { checkMasterclass } from "@/lib/admin/validate";
import { formatHours, tbilisiToday } from "@/lib/format";
import type { MasterclassRec } from "@/lib/types";
import { storePhoto } from "./photo";
import { checkOpts, commit, run } from "./save";
import { listScreen, target, targetScreen } from "./schedule";
import { type BotContext, type FlowAt, type McDraft, type McField, type Steps } from "./state";
import { byRef, cancelKb, esc, parseNumber, photoUrl, ref, show, stale, warn, withNote, type Screen } from "./ui";

// Карточка мастер-класса: создать (по шагам), изменить одно поле, удалить.
// Кнопки: mc:new — создать; mc:<k> — карточка; mc:<k>:e:<поле> — изменить поле; mc:<k>:del — удалить;
// f:mcv:<значение> — быстрый ответ на шаге; f:mcp:1|0 — опубликовать сразу или оставить скрытым.
// Даты, свободные места и «скрыть/показать» — в schedule.ts.

type TextField = Exclude<McField, "image">;
type Parsed = string | number | { error: string };

const text = (max: number, what: string) => (t: string): Parsed => {
  const v = t.trim();
  if (!v) return { error: `Напишите ${what}` };
  return v.length > max ? { error: `Слишком длинно: ${v.length} символов из ${max}. Сократите и пришлите ещё раз` } : v;
};

/** Поля карточки (ограничения — как в checkMasterclass): подпись, вопрос, быстрые ответы, разбор ответа */
const FIELDS: Record<TextField, { label: string; ask: string; quick?: number[]; parse(t: string): Parsed }> = {
  title: { label: "Название", ask: "Название мастер-класса (до 80 символов), например «Разделочная доска из массива»:", parse: text(80, "название") },
  desc: {
    label: "Кратко",
    ask: "Короткое описание для карточки на сайте (до 160 символов):",
    parse: text(160, "короткое описание"),
  },
  about: {
    label: "Подробно",
    ask: "Подробное описание — его видно в окне записи (до 1200 символов):",
    parse: text(1200, "подробное описание"),
  },
  hours: {
    label: "Длительность",
    ask: "Сколько часов длится занятие? Шаг — полчаса, например <code>2,5</code>.",
    quick: [1, 1.5, 2, 2.5, 3, 4],
    parse(t) {
      const n = Number(t.replace(",", ".").replace(/[^\d.]/g, ""));
      if (!t.trim() || !Number.isFinite(n) || n < 0.5 || n > 12) return { error: "Нужно от 0,5 до 12 часов" };
      return Number.isInteger(n * 2) ? n : { error: "Шаг — полчаса: 2, 2,5, 3…" };
    },
  },
  price: {
    label: "Цена",
    ask: "Цена за участника, ₾:",
    parse(t) {
      const n = parseNumber(t);
      return n === null || n > 10000 ? { error: "Напишите цену числом, например <code>60</code>" } : n;
    },
  },
  capacity: {
    label: "Группа",
    ask: "Сколько человек в группе (от 1 до 20)?",
    quick: [4, 6, 8, 10, 12],
    parse(t) {
      const n = parseNumber(t);
      return n === null || n < 1 || n > 20 ? { error: "Нужно число от 1 до 20" } : n;
    },
  },
};

/** порядок шагов создания */
const ORDER: (McField | "publish")[] = ["title", "desc", "about", "hours", "price", "capacity", "image", "publish"];

const quickLabel = (field: TextField, v: number) => (field === "hours" ? formatHours(v).short : String(v));

/** Вопрос для поля: при создании — номер шага, при правке — текущее значение */
function askScreen(field: McField, opts: { step?: number; current?: string }): Screen {
  const head = opts.step ? `➕ <b>Новый мастер-класс</b> · шаг ${opts.step} из 7\n\n` : "";
  const now = opts.current ? `\n\nСейчас: ${opts.current}` : "";
  const kb = new InlineKeyboard();
  if (field === "image") return { text: `${head}Пришлите фото для карточки мастер-класса.${now}`, kb: cancelKb() };
  for (const v of FIELDS[field].quick ?? []) kb.text(quickLabel(field, v), `f:mcv:${v}`);
  if (FIELDS[field].quick) kb.row();
  return { text: `${head}${FIELDS[field].ask}${now}`, kb: cancelKb(kb) };
}

const summary = (d: McDraft | MasterclassRec) =>
  [
    `<b>${esc(d.title ?? "")}</b>`,
    "",
    `<b>Кратко:</b> ${esc(d.desc ?? "")}`,
    "",
    `<b>Подробно:</b> ${esc(d.about ?? "")}`,
    "",
    `${formatHours(d.hours ?? 0).long} · ${d.price} ₾ · группа до ${d.capacity}`,
  ].join("\n");

function cardScreen(mc: MasterclassRec): Screen {
  const at = `mc:${ref(mc.id)}`;
  const kb = new InlineKeyboard();
  (Object.keys(FIELDS) as TextField[]).forEach((f, i) => {
    kb.text(FIELDS[f].label, `${at}:e:${f}`);
    if (i % 2 === 1) kb.row();
  });
  kb.text("Фото", `${at}:e:image`).row().text("← Назад", `sc:${ref(mc.id)}`);
  return {
    text: `✏️ ${summary(mc)}${mc.hidden ? "\n🙈 Скрыт с сайта" : ""}\n\nЧто изменить?`,
    kb,
    preview: photoUrl(mc.image.src),
  };
}

export const masterclasses = new Composer<BotContext>();

async function loadMc(ctx: BotContext, k: string) {
  const data = await repo.load();
  const mc = byRef(data.masterclasses, k);
  if (!mc) await show(ctx, withNote(listScreen(data), "Этого мастер-класса уже нет."));
  return mc;
}

/* ---------- Создание ---------- */

masterclasses.callbackQuery("mc:new", async (ctx) => {
  ctx.setFlow({ step: "mc.new", field: "title", draft: {} });
  await show(ctx, askScreen("title", { step: 1 }));
});

/** ответ на шаг создания принят — следующий вопрос */
async function nextStep(ctx: BotContext, flow: FlowAt<"mc.new">, draft: McDraft) {
  const field = ORDER[ORDER.indexOf(flow.field) + 1];
  ctx.setFlow({ step: "mc.new", field, draft });
  if (field !== "publish") return show(ctx, askScreen(field, { step: ORDER.indexOf(field) + 1 }));
  await show(ctx, {
    text: `${summary(draft)}\n\nПоказать мастер-класс на сайте сразу? Если оставить скрытым — сначала можно добавить даты, а показать потом кнопкой «Показать на сайте».`,
    kb: cancelKb(new InlineKeyboard().text("👁 Опубликовать", "f:mcp:1").text("🙈 Оставить скрытым", "f:mcp:0").row()),
    preview: draft.src && photoUrl(draft.src),
  });
}

masterclasses.callbackQuery(/^f:mcp:([01])$/, async (ctx) => {
  const flow = ctx.flow?.step === "mc.new" && ctx.flow.field === "publish" ? ctx.flow : null;
  if (!flow) return stale(ctx);
  const d = flow.draft;
  const data = await repo.load();
  const id = slugify(d.title ?? "", data.masterclasses.map((m) => m.id));
  const hidden = ctx.match[1] === "0";
  const mc = {
    id,
    title: d.title,
    desc: d.desc,
    about: d.about,
    hours: d.hours,
    price: d.price,
    capacity: d.capacity,
    image: { src: d.src, alt: d.title },
    sessions: [],
    hidden,
  };
  if (!(await commit(ctx, checkMasterclass(mc, checkOpts()), (v) => repo.saveMasterclass(v)))) return;
  ctx.setFlow(null);
  const t = target(await repo.load(), ref(id))!;
  await show(ctx, withNote(targetScreen(t), `✅ Мастер-класс создан${hidden ? " (скрыт с сайта)" : " и уже на сайте"}. Теперь добавьте даты.`));
});

/* ---------- Карточка и правка полей ---------- */

masterclasses.callbackQuery(/^mc:(\w+)$/, async (ctx) => {
  const mc = await loadMc(ctx, ctx.match[1]);
  if (mc) await show(ctx, cardScreen(mc));
});

masterclasses.callbackQuery(/^mc:(\w+):e:(title|desc|about|hours|price|capacity|image)$/, async (ctx) => {
  const mc = await loadMc(ctx, ctx.match[1]);
  if (!mc) return;
  const field = ctx.match[2] as McField;
  ctx.setFlow({ step: "mc.edit", k: ctx.match[1], field });
  const current =
    field === "image" ? undefined : field === "hours" ? formatHours(mc.hours).long : field === "price" ? `${mc.price} ₾` : esc(String(mc[field]));
  await show(ctx, { ...askScreen(field, { current }), preview: field === "image" ? photoUrl(mc.image.src) : undefined });
});

async function saveField(ctx: BotContext, flow: FlowAt<"mc.edit">, value: string | number) {
  const mc = await loadMc(ctx, flow.k);
  if (!mc) return ctx.setFlow(null);
  const next: MasterclassRec = flow.field === "image" ? { ...mc, image: { src: String(value), alt: mc.title } } : { ...mc, [flow.field]: value };
  let note = "✅ Сохранено.";
  // группа стала меньше — свободных мест у дат не может быть больше группы
  if (flow.field === "capacity" && next.sessions.some((s) => s.seatsLeft > next.capacity)) {
    next.sessions = next.sessions.map((s) => ({ ...s, seatsLeft: Math.min(s.seatsLeft, next.capacity) }));
    note += ` У дат, где было свободно больше ${next.capacity}, места уменьшены до ${next.capacity}.`;
  }
  const checked = checkMasterclass({ ...next, sessions: next.sessions.map(toDraft) }, checkOpts());
  if (!(await commit(ctx, checked, (v) => repo.saveMasterclass(v)))) return;
  ctx.setFlow(null);
  await show(ctx, withNote(cardScreen(checked.ok ? checked.value : next), note));
}

/* ---------- Ответы: текст, быстрые кнопки, фото ---------- */

async function answer(ctx: BotContext, raw: string) {
  const flow = ctx.flow;
  if (flow?.step !== "mc.new" && flow?.step !== "mc.edit") return;
  if (flow.field === "image") return void (await warn(ctx, "Жду фото. Передумали — нажмите /cancel"));
  if (flow.field === "publish") return void (await warn(ctx, "Выберите кнопкой выше: опубликовать или оставить скрытым"));
  const v = FIELDS[flow.field].parse(raw);
  if (typeof v === "object") return void (await warn(ctx, v.error));
  if (flow.step === "mc.edit") return saveField(ctx, flow, v);
  await nextStep(ctx, flow, { ...flow.draft, [flow.field]: v });
}

masterclasses.callbackQuery(/^f:mcv:([\d.]+)$/, async (ctx) => {
  if (ctx.flow?.step !== "mc.new" && ctx.flow?.step !== "mc.edit") return stale(ctx);
  await answer(ctx, ctx.match[1]);
});

// фото — только на шаге «фото»; иначе его заберёт галерея
masterclasses.on(["message:photo", "message:document"], async (ctx, next) => {
  const flow = ctx.flow;
  if ((flow?.step !== "mc.new" && flow?.step !== "mc.edit") || flow.field !== "image") return next();
  await ctx.replyWithChatAction("upload_photo").catch(() => {});
  const src = await storePhoto(ctx);
  if (!src) return;
  if (flow.step === "mc.edit") return saveField(ctx, flow, src);
  await nextStep(ctx, flow, { ...flow.draft, src });
});

export const masterclassSteps: Steps = {
  "mc.new": (ctx, t) => answer(ctx, t),
  "mc.edit": (ctx, t) => answer(ctx, t),
};

/* ---------- Удаление ---------- */

masterclasses.callbackQuery(/^mc:(\w+):del$/, async (ctx) => {
  const mc = await loadMc(ctx, ctx.match[1]);
  if (!mc) return;
  const ahead = mc.sessions.filter((s) => s.start.slice(0, 10) >= tbilisiToday()).length;
  await show(ctx, {
    text: [
      `Удалить мастер-класс <b>${esc(mc.title)}</b>${ahead ? ` вместе с датами (впереди — ${ahead})` : ""}?`,
      ahead ? "Если на них уже записались — не забудьте предупредить людей." : "",
      "Если нужно убрать с сайта на время — лучше скрыть. Удаление можно отменить через /undo.",
    ]
      .filter(Boolean)
      .join("\n"),
    kb: new InlineKeyboard().text("🗑 Да, удалить", `mc:${ctx.match[1]}:del!`).row().text("Нет", `sc:${ctx.match[1]}`),
  });
});

masterclasses.callbackQuery(/^mc:(\w+):del!$/, async (ctx) => {
  const mc = await loadMc(ctx, ctx.match[1]);
  if (!mc) return;
  if (!(await run(ctx, () => repo.deleteMasterclass(mc.id)))) return;
  await show(ctx, withNote(listScreen(await repo.load()), `🗑 Мастер-класс «${esc(mc.title)}» удалён.`));
});
