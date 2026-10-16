"use client";

import Image from "next/image";
import { useState } from "react";
import { ContactFields, SendError } from "@/components/forms/Fields";
import { useLeadForm } from "@/components/forms/useLeadForm";
import { useDict } from "@/components/providers/DictProvider";
import { Check, Minus, Plus } from "@/components/ui/Icons";
import { t } from "@/i18n";
import { formatDay, formatRange, plural } from "@/lib/format";
import type { Masterclass } from "@/lib/types";
import { ModalFrame, Opt, ms as s } from "./ModalFrame";

export function MasterclassModal({ items, initialId }: { items: Masterclass[]; initialId: string | null }) {
  const dict = useDict();
  const d = dict.modal.mc;
  const preset = items.find((m) => m.id === initialId);
  const [mcId, setMcId] = useState((preset ?? items[0]).id);
  const mc = items.find((m) => m.id === mcId) ?? items[0];
  const firstFree = Math.max(0, mc.sessions.findIndex((x) => x.seatsLeft > 0));
  const [sel, setSel] = useState(firstFree);
  const [count, setCount] = useState(2);

  const session = mc.sessions[sel] ?? mc.sessions[0];
  const max = Math.max(1, session?.seatsLeft ?? 1);
  const n = Math.min(count, max);
  const total = n * mc.price;
  const when = session ? `${formatDay(session.start)} · ${formatRange(session.start, session.end)}` : "";
  const people = `${n} ${plural(n, ["человек", "человека", "человек"])}`;

  const form = useLeadForm("masterclass", (data) => ({
    fields: [
      ["Мастер-класс", mc.title],
      ["Дата", when],
      ["Участники", `${people} · ${total} ₾`],
      ["Комментарий", String(data.get("comment") ?? "")],
    ],
    summary: [
      ["Формат", `Мастер-класс «${mc.title}»`],
      ["Когда", when],
      ["Участники", `${people} · ${total} ₾`],
    ],
  }));

  const side = (
    <aside className={s.side}>
      <div className={`ph ${s.sideImg}`} style={{ "--pos": mc.image.pos ?? "50% 50%" } as React.CSSProperties}>
        <Image src={mc.image.src} alt={mc.image.alt} fill sizes="(max-width: 760px) 100vw, 440px" />
      </div>
      <span className="mono wd">{t(d.tag, { num: mc.num })}</span>
      <h2 className={s.title} id="modal-title">
        {mc.title}
      </h2>
      <div className={`${s.pills} mono`}>
        <span>{mc.duration}</span>
        <span>{mc.price} ₾</span>
        <span>{t(d.upTo, { n: mc.capacity })}</span>
      </div>
      <p className="txt">{mc.about}</p>
      <span className="mono" style={{ color: "var(--mut)", marginTop: 6 }}>
        {d.inclLabel}
      </span>
      <ul className={s.chk}>
        {d.incl.map((x) => (
          <li key={x}>
            <Check size={18} />
            {x}
          </li>
        ))}
      </ul>
    </aside>
  );

  return (
    <ModalFrame side={side}>
      <form className={s.main} onSubmit={form.onSubmit} noValidate aria-labelledby="modal-title">
        <div className={s.head}>
          <span className="mono">{d.step}</span>
          <p className={s.formTitle}>{d.title}</p>
        </div>

        {/* открыли без конкретного МК (кнопка «Записаться») — даём выбрать */}
        {!preset && (
          <fieldset className="fs">
            <legend>{d.pick}</legend>
            <div className={s.list}>
              {items.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className={`${s.row} ${m.id === mcId ? s.on : ""}`}
                  aria-pressed={m.id === mcId}
                  onClick={() => {
                    setMcId(m.id);
                    setSel(Math.max(0, m.sessions.findIndex((x) => x.seatsLeft > 0)));
                  }}
                >
                  <b>{m.title}</b>
                  <span className="mono">
                    {m.durationShort} · {m.price} ₾
                  </span>
                </button>
              ))}
            </div>
          </fieldset>
        )}

        <fieldset className="fs">
          <legend>{d.dates}</legend>
          {!mc.sessions.length && <p className="txt">{d.noDates}</p>}
          <div className={s.opts}>
            {mc.sessions.map((x, k) => (
              <Opt key={x.start} on={k === sel} onClick={() => setSel(k)} disabled={x.seatsLeft === 0}>
                <span className="mono">{formatDay(x.start)}</span>
                <b>{formatRange(x.start, x.end)}</b>
                <span className="mono">
                  {x.seatsLeft > 0 ? t(dict.mc.seatsLeft, { n: x.seatsLeft, max: mc.capacity }) : d.noSeats}
                </span>
              </Opt>
            ))}
          </div>
        </fieldset>

        <div className="fs">
          <span className="fs-l" id="mc-count">
            {d.count}
          </span>
          <div className={s.step} role="group" aria-labelledby="mc-count">
            <button type="button" onClick={() => setCount(Math.max(1, n - 1))} disabled={n <= 1} aria-label={d.less}>
              <Minus size={18} />
            </button>
            <output aria-live="polite">{n}</output>
            <button type="button" onClick={() => setCount(Math.min(max, n + 1))} disabled={n >= max} aria-label={d.more}>
              <Plus size={18} />
            </button>
          </div>
        </div>

        <ContactFields errors={form.errors} clear={form.clear} />
        <label className="fl">
          <span>
            {d.comment}
            {dict.form.optional}
          </span>
          <textarea name="comment" placeholder={d.commentPh} />
        </label>

        <div className={s.tot}>
          <span className="mono">{t(d.total, { n, price: mc.price })}</span>
          <span className={s.sum}>{total} ₾</span>
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
