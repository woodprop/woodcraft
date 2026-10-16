"use client";

import { useState } from "react";
import { saveReviews } from "@/app/admin/actions";
import { REVIEW_FORMATS as FORMATS, uid } from "@/lib/admin/drafts";
import type { ReviewRec } from "@/lib/types";
import { IDown, IEdit, IEye, IEyeOff, IPlus, ITrash, IUp } from "./icons";
import { Badge, IconButton, PageHead, SelectField, TextField } from "./ui";
import { SaveBar, useEditor } from "./useEditor";
import s from "./admin.module.css";

export function ReviewsEditor({ initial }: { initial: ReviewRec[] }) {
  const ed = useEditor(initial, saveReviews);
  const { draft, set, edit, err } = ed;
  const [open, setOpen] = useState<string | null>(null);
  const itemErr = (i: number) => Object.keys(ed.errors).some((k) => k.startsWith(`${i}.`));

  const move = (i: number, dir: -1 | 1) =>
    edit((d) => {
      const j = i + dir;
      [d[i], d[j]] = [d[j], d[i]];
    });

  const add = () => {
    const id = uid("r");
    edit((d) => void d.unshift({ id, name: "", format: FORMATS[0], text: "", made: "" }));
    setOpen(id);
  };

  return (
    <>
      <PageHead title="Отзывы" sub="Блок «Что говорят участники». Порядок здесь — порядок на сайте. Скрытые отзывы остаются в списке, но не видны на сайте.">
        <button type="button" className={`${s.btn} ${s.btnAcc}`} onClick={add}>
          <IPlus size={18} /> Добавить отзыв
        </button>
      </PageHead>

      <section className={s.card}>
        <ul className={s.list}>
          {draft.map((r, i) => {
            const isOpen = open === r.id || itemErr(i);
            return (
              <li key={r.id} className={`${s.editor} ${isOpen ? s.editorOpen : ""}`}>
                <div className={`${s.item} ${r.hidden ? s.itemHidden : ""}`}>
                  <div className={s.itemBody}>
                    <div className={s.actions} style={{ gap: 8 }}>
                      <span className={s.itemTitle}>{r.name || "Новый отзыв"}</span>
                      <Badge>{r.format}</Badge>
                      {r.hidden && <Badge>скрыт</Badge>}
                      {itemErr(i) && <Badge tone="err">нужно исправить</Badge>}
                    </div>
                    <p className={s.itemMeta} style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {r.text}
                    </p>
                  </div>
                  <div className={s.itemSide}>
                    <IconButton label="Выше" disabled={i === 0} onClick={() => move(i, -1)}>
                      <IUp />
                    </IconButton>
                    <IconButton label="Ниже" disabled={i === draft.length - 1} onClick={() => move(i, 1)}>
                      <IDown />
                    </IconButton>
                    <IconButton label={r.hidden ? "Показать на сайте" : "Скрыть с сайта"} onClick={() => set(`${i}.hidden`, !r.hidden)}>
                      {r.hidden ? <IEyeOff /> : <IEye />}
                    </IconButton>
                    <IconButton label={isOpen ? "Свернуть" : "Изменить"} onClick={() => setOpen(isOpen ? null : r.id)}>
                      <IEdit />
                    </IconButton>
                    <IconButton
                      label="Удалить отзыв"
                      danger
                      onClick={() => confirm(`Удалить отзыв${r.name ? ` от «${r.name}»` : ""}? Если отзыв может пригодиться — лучше скрыть его.`) && edit((d) => void d.splice(i, 1))}
                    >
                      <ITrash />
                    </IconButton>
                  </div>
                </div>
                {isOpen && (
                  <div className={s.editorBody}>
                    <div className={s.grid2}>
                      <TextField
                        label="Имя"
                        hint="Как подписать отзыв, например «Тамара, HR»."
                        value={r.name}
                        onChange={(v) => set(`${i}.name`, v)}
                        error={err(`${i}.name`)}
                        max={40}
                      />
                      <SelectField
                        label="Формат"
                        value={r.format}
                        onChange={(v) => set(`${i}.format`, v)}
                        options={[...new Set([...FORMATS, r.format])].map((f) => ({ value: f, label: f }))}
                        error={err(`${i}.format`)}
                      />
                    </div>
                    <TextField label="Текст отзыва" value={r.text} onChange={(v) => set(`${i}.text`, v)} error={err(`${i}.text`)} max={600} multiline rows={4} />
                    <TextField
                      label="Что сделал(а)"
                      hint="Подпись внизу карточки, например «Сделала · разделочную доску». Можно оставить пустым."
                      value={r.made}
                      onChange={(v) => set(`${i}.made`, v)}
                      error={err(`${i}.made`)}
                      max={60}
                    />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
        {!draft.length && <p className={s.empty}>Отзывов пока нет.</p>}
      </section>

      <SaveBar editor={ed} />
    </>
  );
}
