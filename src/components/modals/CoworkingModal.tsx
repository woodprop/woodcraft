"use client";

import Image from "next/image";
import { useState } from "react";
import { ContactFields, SendError } from "@/components/forms/Fields";
import { useLeadForm } from "@/components/forms/useLeadForm";
import { useDict } from "@/components/providers/DictProvider";
import { coworkingDays } from "@/lib/schedule";
import type { CoworkingSchedule, Tariff } from "@/lib/types";
import { ModalFrame, Opt, ms as s } from "./ModalFrame";

function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function CoworkingModal({
  tariffs,
  schedule,
  initialTariff,
}: {
  tariffs: Tariff[];
  schedule: CoworkingSchedule;
  initialTariff: string | null;
}) {
  const dict = useDict();
  const d = dict.modal.cw;
  const [days] = useState(() => coworkingDays(schedule, todayIso()));
  // по умолчанию — тариф, выбранный на сайте, иначе первый почасовой без выделения
  const [tIdx, setT] = useState(() => {
    const i = tariffs.findIndex((x) => x.id === initialTariff);
    return Math.max(0, i >= 0 ? i : tariffs.findIndex((x) => !x.fullDay && !x.highlight));
  });
  const [dIso, setD] = useState(() => days.find((x) => !x.closed)?.iso ?? "");
  const [time, setTime] = useState<string | null>(null);
  const [first, setFirst] = useState(false);

  const tariff = tariffs[tIdx];
  const fullDay = !!tariff.fullDay;
  const day = days.find((x) => x.iso === dIso && !x.closed);
  const times = day?.times ?? [];
  // выбранное время недоступно в этот день — берём пятый слот (вечер), как в макете
  const hour = time && times.includes(time) ? time : times[Math.min(4, times.length - 1)];
  const when = day ? `${day.wd}, ${day.label}` : "день согласуем";
  const summary = `${when} · ${fullDay ? d.fullDay : hour ? `${hour} · ${tariff.label}` : tariff.label}`;

  const form = useLeadForm("coworking", (data) => ({
    fields: [
      ["Тариф", `${tariff.label} · ${tariff.price} ₾`],
      ["Когда", summary],
      ["Первое посещение", first ? "да, нужен инструктаж" : "нет"],
      ["Проект", String(data.get("project") ?? "")],
    ],
    summary: [
      ["Формат", `Коворкинг · ${tariff.label}`],
      ["Когда", fullDay ? `${when} · весь день` : `${when}${hour ? ` · ${hour}` : ""}`],
      ["Стоимость", `${tariff.price} ₾${first ? " + инструктаж" : ""}`],
    ],
  }));

  const side = (
    <aside className={`${s.side} ${s.sideDark}`}>
      <div className={`ph ${s.sideImg}`} style={{ "--pos": "50% 45%", background: "#3a3029" } as React.CSSProperties}>
        <Image src="/images/coworking.jpg" alt="Резидент коворкинга размечает заготовку" fill sizes="(max-width: 760px) 100vw, 440px" />
      </div>
      <span className="mono acc">{d.tag}</span>
      <h2 className={s.title} id="modal-title">
        {d.title}
      </h2>
      <p className="txt">{d.text}</p>
      <ol className={s.rules}>
        {d.rules.map((r, i) => (
          <li key={r}>
            <span className="mono">{String(i + 1).padStart(2, "0")}</span>
            <span>{r}</span>
          </li>
        ))}
      </ol>
    </aside>
  );

  return (
    <ModalFrame side={side}>
      <form className={s.main} onSubmit={form.onSubmit} noValidate aria-labelledby="modal-title">
        <div className={s.head}>
          <span className="mono">{d.step}</span>
          <p className={s.formTitle}>{d.formTitle}</p>
        </div>

        <fieldset className="fs">
          <legend>{d.tariff}</legend>
          <div className={`${s.opts} ${s.optsSm}`}>
            {tariffs.map((x, k) => (
              <Opt key={x.id} on={k === tIdx} onClick={() => setT(k)}>
                <span className="mono">{x.label}</span>
                <span className={s.big}>{x.price} ₾</span>
              </Opt>
            ))}
          </div>
        </fieldset>

        <fieldset className="fs">
          <legend>{d.day}</legend>
          {!day && <p className="txt">{d.noDays}</p>}
          <div className={`${s.opts} ${s.days}`}>
            {days.map((x) => (
              <Opt key={x.iso} on={x.iso === dIso} onClick={() => setD(x.iso)} className={s.sm} disabled={!!x.closed}>
                <span className="mono">{x.wd}</span>
                <b>{x.label}</b>
              </Opt>
            ))}
          </div>
        </fieldset>

        {!fullDay && day && (
          <fieldset className="fs">
            <legend>{d.start}</legend>
            {!times.length && <p className="txt">{d.noTimes}</p>}
            <div className={`${s.opts} ${s.times}`}>
              {times.map((x) => (
                <Opt key={x} on={x === hour} onClick={() => setTime(x)} className={s.sm}>
                  <b>{x}</b>
                </Opt>
              ))}
            </div>
          </fieldset>
        )}

        <label className={s.cb}>
          <input type="checkbox" checked={first} onChange={(e) => setFirst(e.target.checked)} />
          <span>
            <b>{d.firstVisit}</b>
            <span className="txt">{d.firstVisitNote}</span>
          </span>
        </label>

        <ContactFields errors={form.errors} clear={form.clear} />
        <label className="fl">
          <span>
            {d.project}
            {dict.form.optional}
          </span>
          <textarea name="project" placeholder={d.projectPh} />
        </label>

        <div className={s.tot}>
          <span className="mono">{summary}</span>
          <span className={s.sum}>{tariff.price} ₾</span>
        </div>
        <SendError show={form.failed} />
        <button className={`btn btn-a ${s.submit}`} type="submit" disabled={form.sending}>
          {form.sending ? dict.form.sending : d.submit}
        </button>
        <p className="legal">{d.legal}</p>
      </form>
    </ModalFrame>
  );
}
