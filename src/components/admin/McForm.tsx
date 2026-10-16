"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { deleteMasterclass, saveMasterclass } from "@/app/admin/actions";
import { slugify, toDraft, type SessionDraft } from "@/lib/admin/drafts";
import { formatHours } from "@/lib/format";
import type { MasterclassRec } from "@/lib/types";
import { ITrash } from "./icons";
import { PhotoPicker } from "./PhotoPicker";
import { SessionsEditor } from "./SessionsEditor";
import { NumberField, PageHead, SelectField, Switch, TextField } from "./ui";
import { SaveBar, useEditor } from "./useEditor";
import s from "./admin.module.css";

type Draft = Omit<MasterclassRec, "sessions"> & { sessions: SessionDraft[] };

const HOURS = Array.from({ length: 16 }, (_, i) => (i + 1) / 2).map((h) => ({ value: String(h), label: formatHours(h).long }));

export function McForm({
  initial,
  isNew,
  takenIds,
  library,
  today,
}: {
  initial: MasterclassRec;
  isNew: boolean;
  takenIds: string[];
  library: string[];
  today: string;
}) {
  const router = useRouter();
  const [deleting, startDelete] = useTransition();
  const ed = useEditor<Draft>({ ...initial, hidden: !!initial.hidden, sessions: initial.sessions.map(toDraft) }, saveMasterclass, {
    onSaved: (d) => {
      if (isNew) router.replace(`/admin/events/${d.id}`);
    },
  });
  const { draft, set, edit, err } = ed;

  const setTitle = (v: string) => {
    set("title", v);
    // адрес нового мастер-класса строится из названия: ?book=masterclass&id=taburet
    if (isNew) set("id", slugify(v, takenIds));
  };

  const remove = () => {
    if (!confirm(`Удалить мастер-класс «${initial.title}» вместе со всеми датами? Это нельзя отменить.`)) return;
    startDelete(() => deleteMasterclass(initial.id));
  };

  return (
    <>
      <PageHead
        title={isNew ? "Новый мастер-класс" : initial.title}
        sub={isNew ? "Заполните карточку и добавьте даты. На сайте мастер-класс появится после сохранения." : undefined}
      />

      <section className={s.card}>
        <h2 className={s.h2} style={{ marginBottom: 16 }}>
          Карточка
        </h2>
        <div className={s.stack}>
          <TextField label="Название" value={draft.title} onChange={setTitle} error={err("title")} max={80} placeholder="Например, Разделочная доска из массива" />
          <TextField
            label="Короткое описание"
            hint="Одно предложение под названием в карточке на сайте."
            value={draft.desc}
            onChange={(v) => set("desc", v)}
            error={err("desc")}
            max={160}
            multiline
            rows={2}
          />
          <TextField
            label="Подробное описание"
            hint="Показывается в окне записи: что будете делать, для кого подходит."
            value={draft.about}
            onChange={(v) => set("about", v)}
            error={err("about")}
            max={1200}
            multiline
            rows={4}
          />
          <div className={s.grid3}>
            <SelectField label="Длительность" value={String(draft.hours)} onChange={(v) => set("hours", Number(v))} options={HOURS} error={err("hours")} />
            <NumberField label="Цена за человека" suffix="₾" value={draft.price} onChange={(v) => set("price", v)} error={err("price")} max={10000} />
            <NumberField
              label="Мест в группе"
              suffix="чел."
              value={draft.capacity}
              onChange={(v) => set("capacity", v)}
              error={err("capacity")}
              min={1}
              max={20}
            />
          </div>
          <Switch checked={!!draft.hidden} onChange={(v) => set("hidden", v)}>
            Скрыть с сайта (например, на время отпуска мастера)
          </Switch>
        </div>
      </section>

      <section className={s.card}>
        <PhotoPicker value={draft.image} onChange={(img) => set("image", img)} library={library} error={err("image")} />
      </section>

      <section className={s.card}>
        <div className={s.cardHead}>
          <div>
            <h2 className={s.h2}>Даты и свободные места</h2>
            <p className={s.sub}>
              Когда кто-то записался — уменьшите число свободных мест. Ноль — дата видна, но записаться на неё нельзя.
            </p>
          </div>
        </div>
        <SessionsEditor
          sessions={draft.sessions}
          path="sessions"
          set={set}
          replace={(list) => edit((d) => void (d.sessions = list))}
          err={err}
          capacity={Number.isFinite(draft.capacity) ? draft.capacity : 6}
          minutes={draft.hours * 60}
          today={today}
        />
      </section>

      {!isNew && (
        <section className={s.card}>
          <div className={s.cardHead} style={{ marginBottom: 0 }}>
            <div>
              <h2 className={s.h2}>Удалить мастер-класс</h2>
              <p className={s.sub}>Если мастер-класс нужно убрать на время — лучше скрыть его переключателем выше.</p>
            </div>
            <button type="button" className={`${s.btn} ${s.btnDanger}`} onClick={remove} disabled={deleting}>
              <ITrash size={18} /> {deleting ? "Удаляем…" : "Удалить"}
            </button>
          </div>
        </section>
      )}

      <SaveBar editor={isNew ? { ...ed, dirty: true } : ed} label={isNew ? "Новый мастер-класс ещё не сохранён" : undefined} />
    </>
  );
}
