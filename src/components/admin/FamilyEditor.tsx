"use client";

import Link from "next/link";
import { saveFamily } from "@/app/admin/actions";
import { toDraft, uid, type SessionDraft } from "@/lib/admin/drafts";
import type { Family, Option } from "@/lib/types";
import { IPlus, ITrash } from "./icons";
import { SessionsEditor } from "./SessionsEditor";
import { IconButton } from "./ui";
import { SaveBar, useEditor } from "./useEditor";
import s from "./admin.module.css";

type Draft = { products: Option[]; sessions: SessionDraft[] };

/** Семейные мастер-классы: изделия на выбор и даты */
export function FamilyEditor({ family, today }: { family: Family; today: string }) {
  const ed = useEditor<Draft>({ products: family.products, sessions: family.sessions.map(toDraft) }, saveFamily);
  const { draft, set, edit, err } = ed;
  const productErr = err("products") ?? (draft.products.some((_, i) => err(`products.${i}.label`)) ? "Заполните названия изделий" : undefined);

  return (
    <section className={s.card} id="family">
      <div className={s.cardHead}>
        <div>
          <h2 className={s.h2}>Для семьи — дети с родителями</h2>
          <p className={s.sub}>
            Даты и изделия на выбор в окне записи «Для семьи». Цена за пару — {family.price} ₾, она{" "}
            <Link href="/admin/prices">меняется в разделе «Цены»</Link>.
          </p>
        </div>
      </div>

      <div className={s.stack}>
        <div className={s.field}>
          <span className={s.label}>Что можно сделать</span>
          <div className={s.list}>
            {draft.products.map((p, i) => (
              <div key={p.id} className={s.actions} style={{ flexWrap: "nowrap" }}>
                <input
                  className={s.input}
                  value={p.label}
                  placeholder="Например, скворечник"
                  aria-label={`Изделие ${i + 1}`}
                  aria-invalid={!!err(`products.${i}.label`)}
                  onChange={(e) => set(`products.${i}.label`, e.target.value)}
                />
                <IconButton label="Удалить изделие" danger onClick={() => edit((d) => void d.products.splice(i, 1))}>
                  <ITrash />
                </IconButton>
              </div>
            ))}
          </div>
          {productErr && <span className={s.errText}>{productErr}</span>}
          <div>
            <button
              type="button"
              className={`${s.btn} ${s.btnGhost} ${s.btnSm}`}
              onClick={() => edit((d) => void d.products.push({ id: uid("fp"), label: "" }))}
            >
              <IPlus size={18} /> Добавить изделие
            </button>
          </div>
        </div>

        <div className={s.field}>
          <span className={s.label}>Даты</span>
          <SessionsEditor
            sessions={draft.sessions}
            path="sessions"
            set={set}
            replace={(list) => edit((d) => void (d.sessions = list))}
            err={err}
            capacity={20}
            defaultSeats={3}
            minutes={120}
            today={today}
          />
        </div>
      </div>
      <SaveBar editor={ed} />
    </section>
  );
}
