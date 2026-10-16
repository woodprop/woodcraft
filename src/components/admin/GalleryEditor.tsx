"use client";

import Image from "next/image";
import { useState } from "react";
import { saveGallery } from "@/app/admin/actions";
import { uid } from "@/lib/admin/drafts";
import type { GalleryCategory, GalleryItem } from "@/lib/types";
import { IDown, IEdit, IEye, IEyeOff, IPlus, ITrash, IUp } from "./icons";
import { PhotoPicker } from "./PhotoPicker";
import { Badge, IconButton, PageHead, SelectField, TextField } from "./ui";
import { SaveBar, useEditor } from "./useEditor";
import s from "./admin.module.css";

type Draft = { categories: GalleryCategory[]; items: GalleryItem[] };

/** перестановка элемента массива на соседнее место */
function move<T>(list: T[], i: number, dir: -1 | 1) {
  const j = i + dir;
  if (j < 0 || j >= list.length) return;
  [list[i], list[j]] = [list[j], list[i]];
}

export function GalleryEditor({ initial, library }: { initial: Draft; library: string[] }) {
  const ed = useEditor(initial, saveGallery);
  const { draft, set, edit, err } = ed;
  const [open, setOpen] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");

  const cats = draft.categories.filter((c) => c.id !== "all");
  const catLabel = (id: string) => cats.find((c) => c.id === id)?.label ?? "без категории";
  const itemErr = (i: number) => Object.keys(ed.errors).some((k) => k.startsWith(`items.${i}.`));

  const add = () => {
    const id = uid("g");
    edit((d) =>
      void d.items.unshift({ id, category: filter !== "all" ? filter : (cats[0]?.id ?? ""), title: "", sub: "", image: { src: "", alt: "" } }),
    );
    setOpen(id);
  };

  return (
    <>
      <PageHead
        title="Галерея работ"
        sub="Работы участников в блоке «Это сделали люди, которые пришли впервые». Порядок здесь — порядок на сайте; на телефоне сначала видны первые 6."
      >
        <button type="button" className={`${s.btn} ${s.btnAcc}`} onClick={add}>
          <IPlus size={18} /> Добавить работу
        </button>
      </PageHead>

      <section className={s.card}>
        <div className={s.cardHead}>
          <div>
            <h2 className={s.h2}>Работы</h2>
          </div>
          <div className={s.chips} role="group" aria-label="Показать категорию">
            {draft.categories.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`${s.btn} ${s.btnSm} ${c.id === filter ? "" : s.btnGhost}`}
                aria-pressed={c.id === filter}
                onClick={() => setFilter(c.id)}
              >
                {c.label} · {c.id === "all" ? draft.items.length : draft.items.filter((g) => g.category === c.id).length}
              </button>
            ))}
          </div>
        </div>

        <ul className={s.list}>
          {draft.items.map((g, i) => {
            if (filter !== "all" && g.category !== filter) return null;
            const isOpen = open === g.id || itemErr(i);
            const p = `items.${i}`;
            return (
              <li key={g.id} className={`${s.editor} ${isOpen ? s.editorOpen : ""}`}>
                <div className={`${s.item} ${g.hidden ? s.itemHidden : ""}`}>
                  <div className={s.thumb}>
                    {g.image.src && <Image src={g.image.src} alt="" fill sizes="72px" style={{ objectPosition: g.image.pos }} />}
                  </div>
                  <div className={s.itemBody}>
                    <div className={s.itemTitle}>{g.title || "Без названия"}</div>
                    <div className={s.itemMeta}>
                      <span>{g.sub}</span>
                      <Badge>{catLabel(g.category)}</Badge>
                      {g.hidden && <Badge>скрыта</Badge>}
                      {itemErr(i) && <Badge tone="err">нужно исправить</Badge>}
                    </div>
                  </div>
                  <div className={s.itemSide}>
                    <IconButton label="Выше" disabled={i === 0} onClick={() => edit((d) => move(d.items, i, -1))}>
                      <IUp />
                    </IconButton>
                    <IconButton label="Ниже" disabled={i === draft.items.length - 1} onClick={() => edit((d) => move(d.items, i, 1))}>
                      <IDown />
                    </IconButton>
                    <IconButton label={g.hidden ? "Показать на сайте" : "Скрыть с сайта"} onClick={() => set(`${p}.hidden`, !g.hidden)}>
                      {g.hidden ? <IEyeOff /> : <IEye />}
                    </IconButton>
                    <IconButton label={isOpen ? "Свернуть" : "Изменить"} onClick={() => setOpen(isOpen ? null : g.id)}>
                      <IEdit />
                    </IconButton>
                    <IconButton
                      label="Удалить работу"
                      danger
                      onClick={() => confirm(`Удалить «${g.title || "работу без названия"}» из галереи?`) && edit((d) => void d.items.splice(i, 1))}
                    >
                      <ITrash />
                    </IconButton>
                  </div>
                </div>
                {isOpen && (
                  <div className={s.editorBody}>
                    <div className={s.grid2}>
                      <TextField
                        label="Название"
                        value={g.title}
                        onChange={(v) => set(`${p}.title`, v)}
                        error={err(`${p}.title`)}
                        max={80}
                        placeholder="Например, Табурет из дуба"
                      />
                      <SelectField
                        label="Категория"
                        value={g.category}
                        onChange={(v) => set(`${p}.category`, v)}
                        options={[...(g.category ? [] : [{ value: "", label: "— выберите —" }]), ...cats.map((c) => ({ value: c.id, label: c.label }))]}
                        error={err(`${p}.category`)}
                      />
                    </div>
                    <TextField
                      label="Подпись"
                      hint="Кто и где сделал, например «Мастер-класс · первая работа Анны»."
                      value={g.sub}
                      onChange={(v) => set(`${p}.sub`, v)}
                      error={err(`${p}.sub`)}
                      max={80}
                    />
                    <PhotoPicker value={g.image} onChange={(img) => set(`${p}.image`, img)} library={library} error={err(`${p}.image`)} />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
        {!draft.items.length && <p className={s.empty}>В галерее пока нет работ.</p>}
      </section>

      <section className={s.card}>
        <div className={s.cardHead}>
          <div>
            <h2 className={s.h2}>Категории</h2>
            <p className={s.sub}>Кнопки-фильтры над галереей. Категорию можно удалить, только если в ней нет работ.</p>
          </div>
        </div>
        <div className={s.list}>
          {draft.categories.map((c, i) => {
            const used = draft.items.some((g) => g.category === c.id);
            return (
              <div key={c.id} className={s.actions} style={{ flexWrap: "nowrap" }}>
                <input
                  className={`${s.input} ${s.inputSm}`}
                  value={c.label}
                  aria-label={`Категория ${i + 1}`}
                  aria-invalid={!!err(`categories.${i}.label`)}
                  onChange={(e) => set(`categories.${i}.label`, e.target.value)}
                />
                {c.id === "all" ? (
                  <span className={s.hint} style={{ width: 140, flex: "none" }}>
                    показывает все работы
                  </span>
                ) : (
                  <IconButton label={used ? "В категории есть работы" : "Удалить категорию"} danger disabled={used} onClick={() => edit((d) => void d.categories.splice(i, 1))}>
                    <ITrash />
                  </IconButton>
                )}
              </div>
            );
          })}
        </div>
        <button
          type="button"
          className={`${s.btn} ${s.btnGhost} ${s.btnSm}`}
          style={{ marginTop: 12 }}
          onClick={() => edit((d) => void d.categories.push({ id: uid("cat"), label: "" }))}
        >
          <IPlus size={18} /> Добавить категорию
        </button>
      </section>

      <SaveBar editor={ed} />
    </>
  );
}
