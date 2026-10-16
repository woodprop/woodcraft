"use client";

import { useState } from "react";
import { saveCoworking } from "@/app/admin/actions";
import { addDays } from "@/lib/admin/drafts";
import { coworkingDays, hoursLines, weekIndex, WEEK_FULL } from "@/lib/schedule";
import type { CoworkingSchedule } from "@/lib/types";
import { IClose, IPlus, ITrash } from "./icons";
import { IconButton, NumberField, PageHead, Switch } from "./ui";
import { SaveBar, useEditor } from "./useEditor";
import s from "./admin.module.css";

export function CoworkingForm({ initial, today }: { initial: CoworkingSchedule; today: string }) {
  const ed = useEditor(initial, saveCoworking);
  const { draft, set, edit, err } = ed;
  const [slot, setSlot] = useState("");

  const addSlot = () => {
    if (!slot || draft.slotTimes.includes(slot)) return;
    edit((d) => void (d.slotTimes = [...d.slotTimes, slot].sort()));
    setSlot("");
  };

  const preview = Number.isFinite(draft.daysAhead) && draft.daysAhead > 0 ? coworkingDays({ ...draft, daysAhead: Math.min(draft.daysAhead, 60) }, today) : [];

  return (
    <>
      <PageHead
        title="Расписание коворкинга"
        sub="Когда мастерская открыта и какое время можно выбрать при бронировании. Часы работы в подвале сайта собираются отсюда же."
      />

      <section className={s.card}>
        <div className={s.cardHead}>
          <div>
            <h2 className={s.h2}>Часы работы по дням недели</h2>
            <p className={s.sub}>
              На сайте: {hoursLines(draft.week).map(([d, t]) => `${d} ${t}`).join(" · ")}
            </p>
          </div>
        </div>
        <div className={s.week}>
          {draft.week.map((day, i) => (
            <div className={s.weekRow} key={i}>
              <b>{WEEK_FULL[i]}</b>
              <Switch checked={day.open} onChange={(v) => set(`week.${i}.open`, v)}>
                {day.open ? "Открыто" : "Выходной"}
              </Switch>
              {day.open ? (
                <div className={s.weekTimes}>
                  <input
                    type="time"
                    step={900}
                    className={`${s.input} ${s.inputSm}`}
                    value={day.from}
                    aria-label={`${WEEK_FULL[i]}: открытие`}
                    aria-invalid={!!err(`week.${i}.from`)}
                    onChange={(e) => set(`week.${i}.from`, e.target.value)}
                  />
                  <span>—</span>
                  <input
                    type="time"
                    step={900}
                    className={`${s.input} ${s.inputSm}`}
                    value={day.to}
                    aria-label={`${WEEK_FULL[i]}: закрытие`}
                    aria-invalid={!!err(`week.${i}.to`)}
                    onChange={(e) => set(`week.${i}.to`, e.target.value)}
                  />
                  {(err(`week.${i}.to`) || err(`week.${i}.from`)) && (
                    <span className={s.errText}>{err(`week.${i}.to`) ?? err(`week.${i}.from`)}</span>
                  )}
                </div>
              ) : (
                <span className={s.muted}>Запись в этот день закрыта</span>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className={s.card}>
        <div className={s.cardHead}>
          <div>
            <h2 className={s.h2}>Время начала для брони</h2>
            <p className={s.sub}>Варианты «Начало» в окне бронирования. В конкретный день показываются только те, что попадают в часы работы.</p>
          </div>
        </div>
        <div className={s.chips}>
          {draft.slotTimes.map((t) => (
            <span className={s.chip} key={t}>
              {t}
              <button type="button" aria-label={`Убрать ${t}`} onClick={() => edit((d) => void (d.slotTimes = d.slotTimes.filter((x) => x !== t)))}>
                <IClose size={16} />
              </button>
            </span>
          ))}
          <span className={s.actions} style={{ gap: 6 }}>
            <input
              type="time"
              step={900}
              className={`${s.input} ${s.inputSm}`}
              style={{ width: 130 }}
              value={slot}
              aria-label="Новое время начала"
              onChange={(e) => setSlot(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addSlot()}
            />
            <button type="button" className={`${s.btn} ${s.btnGhost} ${s.btnSm}`} onClick={addSlot} disabled={!slot}>
              <IPlus size={18} /> Добавить
            </button>
          </span>
        </div>
        {err("slotTimes") && <span className={s.errText}>{err("slotTimes")}</span>}
        <div style={{ maxWidth: 320, marginTop: 20 }}>
          <NumberField
            label="На сколько дней вперёд открыта запись"
            suffix="дн."
            value={draft.daysAhead}
            onChange={(v) => set("daysAhead", v)}
            error={err("daysAhead")}
            min={1}
            max={60}
          />
        </div>
      </section>

      <section className={s.card}>
        <div className={s.cardHead}>
          <div>
            <h2 className={s.h2}>Закрытые дни</h2>
            <p className={s.sub}>Праздники, санитарные дни, мероприятия — в эти даты записаться в коворкинг нельзя.</p>
          </div>
        </div>
        <div className={s.list}>
          {draft.closedDates.map((c, i) => (
            <div key={i} className={s.actions} style={{ flexWrap: "nowrap" }}>
              <input
                type="date"
                className={`${s.input} ${s.inputSm}`}
                style={{ width: 170, flex: "none" }}
                value={c.date}
                aria-label={`Закрытый день ${i + 1}`}
                aria-invalid={!!err(`closedDates.${i}.date`)}
                onChange={(e) => set(`closedDates.${i}.date`, e.target.value)}
              />
              <input
                className={`${s.input} ${s.inputSm}`}
                value={c.reason}
                placeholder="Причина, например «Новый год»"
                aria-label={`Причина ${i + 1}`}
                onChange={(e) => set(`closedDates.${i}.reason`, e.target.value)}
              />
              <IconButton label="Удалить закрытый день" danger onClick={() => edit((d) => void d.closedDates.splice(i, 1))}>
                <ITrash />
              </IconButton>
            </div>
          ))}
          {!draft.closedDates.length && <p className={s.empty}>Закрытых дней нет.</p>}
        </div>
        <button
          type="button"
          className={`${s.btn} ${s.btnGhost} ${s.btnSm}`}
          style={{ marginTop: 12 }}
          onClick={() => edit((d) => void d.closedDates.push({ date: addDays(today, 1), reason: "" }))}
        >
          <IPlus size={18} /> Добавить закрытый день
        </button>
      </section>

      <section className={s.card}>
        <h2 className={s.h2}>Как это увидит клиент</h2>
        <p className={s.sub} style={{ marginBottom: 16 }}>
          Дни, которые можно выбрать в окне бронирования, начиная с сегодняшнего, и часы работы.
        </p>
        <div className={s.preview}>
          {preview.map((d) => (
            <div key={d.iso} className={`${s.pday} ${d.closed ? s.pdayClosed : ""}`} title={d.times.length ? `Начало: ${d.times.join(", ")}` : "Только тариф на весь день"}>
              <span>{d.wd}</span>
              <b>{d.label}</b>
              <span>{d.closed ?? `${draft.week[weekIndex(d.iso)].from}–${draft.week[weekIndex(d.iso)].to}`}</span>
            </div>
          ))}
        </div>
      </section>

      <SaveBar editor={ed} />
    </>
  );
}
