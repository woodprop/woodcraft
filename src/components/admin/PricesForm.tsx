"use client";

import Link from "next/link";
import { savePrices } from "@/app/admin/actions";
import { uid } from "@/lib/admin/drafts";
import type { Option, Tariff } from "@/lib/types";
import { IPlus, ITrash } from "./icons";
import { Badge, IconButton, NumberField, NumberInput, PageHead, Switch, TextField } from "./ui";
import { SaveBar, useEditor } from "./useEditor";
import s from "./admin.module.css";

type Draft = {
  masterclasses: { id: string; title: string; price: number; hidden: boolean }[];
  tariffs: Tariff[];
  familyPrice: number;
  certificateSums: Option[];
};

const min = (xs: number[]) => {
  const ok = xs.filter(Number.isFinite);
  return ok.length ? Math.min(...ok) : "—";
};

export function PricesForm({ initial }: { initial: Draft }) {
  const ed = useEditor(initial, savePrices);
  const { draft, set, edit, err } = ed;
  const mcFrom = min(draft.masterclasses.filter((m) => !m.hidden).map((m) => m.price));
  const cwFrom = min(draft.tariffs.map((t) => t.price));

  return (
    <>
      <PageHead title="Цены" sub="Все цены сайта на одной странице. Фразы вида «от 35 ₾» в текстах сайта пересчитываются сами." />

      <div className={s.notice}>
        <span>
          Сейчас на сайте: «Мастер-классы для новичков <b>от {mcFrom} ₾</b>», «Столярный коворкинг <b>от {cwFrom} ₾</b> в час», «Для семьи{" "}
          <b>от {Number.isFinite(draft.familyPrice) ? draft.familyPrice : "—"} ₾</b>».
        </span>
      </div>

      <section className={s.card}>
        <div className={s.cardHead}>
          <div>
            <h2 className={s.h2}>Мастер-классы</h2>
            <p className={s.sub}>
              Цена за одного человека. Описание и даты — в разделе <Link href="/admin/events">«Мастер-классы»</Link>.
            </p>
          </div>
        </div>
        <div className={s.tableWrap}>
          <table className={s.table}>
            <tbody>
              {draft.masterclasses.map((m, i) => (
                <tr key={m.id}>
                  <td>
                    {m.title} {m.hidden && <Badge>скрыт</Badge>}
                  </td>
                  <td style={{ width: 160 }}>
                    <div className={s.affix}>
                      <NumberInput
                        small
                        value={m.price}
                        max={10000}
                        label={`Цена: ${m.title}`}
                        invalid={!!err(`masterclasses.${i}.price`)}
                        onChange={(v) => set(`masterclasses.${i}.price`, v)}
                      />
                      <span>₾</span>
                    </div>
                    {err(`masterclasses.${i}.price`) && <span className={s.errText}>{err(`masterclasses.${i}.price`)}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className={s.card}>
        <div className={s.cardHead}>
          <div>
            <h2 className={s.h2}>Коворкинг — тарифы</h2>
            <p className={s.sub}>Карточки тарифов в блоке «Коворкинг» и варианты в окне бронирования.</p>
          </div>
        </div>
        <div className={s.list}>
          {draft.tariffs.map((t, i) => (
            <div key={t.id} className={s.editor} style={{ padding: 16 }}>
              <div className={s.stack}>
                <div className={s.grid2}>
                  <TextField label="Название" value={t.label} onChange={(v) => set(`tariffs.${i}.label`, v)} error={err(`tariffs.${i}.label`)} placeholder="Например, 2 часа" />
                  <NumberField label="Цена" suffix="₾" value={t.price} onChange={(v) => set(`tariffs.${i}.price`, v)} error={err(`tariffs.${i}.price`)} max={10000} />
                </div>
                <TextField
                  label="Описание"
                  value={t.desc}
                  onChange={(v) => set(`tariffs.${i}.desc`, v)}
                  error={err(`tariffs.${i}.desc`)}
                  max={160}
                />
                <div className={s.actions} style={{ justifyContent: "space-between" }}>
                  <div className={s.actions} style={{ gap: 20 }}>
                    <Switch checked={!!t.highlight} onChange={(v) => set(`tariffs.${i}.highlight`, v)}>
                      Выделить на сайте
                    </Switch>
                    <Switch checked={!!t.fullDay} onChange={(v) => set(`tariffs.${i}.fullDay`, v)}>
                      На весь день (без выбора времени)
                    </Switch>
                  </div>
                  <IconButton
                    label="Удалить тариф"
                    danger
                    disabled={draft.tariffs.length <= 1}
                    onClick={() => confirm(`Удалить тариф «${t.label}»?`) && edit((d) => void d.tariffs.splice(i, 1))}
                  >
                    <ITrash />
                  </IconButton>
                </div>
              </div>
            </div>
          ))}
        </div>
        {err("tariffs") && <span className={s.errText}>{err("tariffs")}</span>}
        <button
          type="button"
          className={`${s.btn} ${s.btnGhost} ${s.btnSm}`}
          style={{ marginTop: 12 }}
          onClick={() => edit((d) => void d.tariffs.push({ id: uid("t"), label: "", price: NaN, desc: "" }))}
        >
          <IPlus size={18} /> Добавить тариф
        </button>
      </section>

      <section className={s.card}>
        <h2 className={s.h2} style={{ marginBottom: 16 }}>
          Для семьи
        </h2>
        <div style={{ maxWidth: 280 }}>
          <NumberField
            label="Цена за пару «взрослый + ребёнок»"
            suffix="₾"
            value={draft.familyPrice}
            onChange={(v) => set("familyPrice", v)}
            error={err("familyPrice")}
            max={10000}
          />
        </div>
      </section>

      <section className={s.card}>
        <div className={s.cardHead}>
          <div>
            <h2 className={s.h2}>Подарочные сертификаты — номиналы</h2>
            <p className={s.sub}>Суммы на выбор в окне «Сертификат на сумму». Сертификат на конкретный мастер-класс стоит как сам мастер-класс.</p>
          </div>
        </div>
        <div className={s.list}>
          {draft.certificateSums.map((c, i) => (
            <div key={c.id} className={s.actions} style={{ alignItems: "flex-start", flexWrap: "nowrap" }}>
              <NumberField
                label="Сумма"
                suffix="₾"
                value={c.price ?? NaN}
                onChange={(v) => set(`certificateSums.${i}.price`, v)}
                error={err(`certificateSums.${i}.price`)}
                min={1}
                max={10000}
                className={s.grow}
              />
              <TextField
                label="Подпись"
                value={c.hint ?? ""}
                onChange={(v) => set(`certificateSums.${i}.hint`, v)}
                error={err(`certificateSums.${i}.hint`)}
                placeholder="Например, Любой МК"
                className={s.grow}
              />
              <div style={{ paddingTop: 30 }}>
                <IconButton
                  label="Удалить номинал"
                  danger
                  disabled={draft.certificateSums.length <= 1}
                  onClick={() => edit((d) => void d.certificateSums.splice(i, 1))}
                >
                  <ITrash />
                </IconButton>
              </div>
            </div>
          ))}
        </div>
        {err("certificateSums") && <span className={s.errText}>{err("certificateSums")}</span>}
        <button
          type="button"
          className={`${s.btn} ${s.btnGhost} ${s.btnSm}`}
          style={{ marginTop: 12 }}
          onClick={() => edit((d) => void d.certificateSums.push({ id: uid("c"), label: "", hint: "", price: NaN }))}
        >
          <IPlus size={18} /> Добавить номинал
        </button>
      </section>

      <SaveBar editor={ed} />
    </>
  );
}
