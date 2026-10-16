"use client";

import Image from "next/image";
import { useState } from "react";
import { ContactFields, SendError } from "@/components/forms/Fields";
import { useLeadForm } from "@/components/forms/useLeadForm";
import { useDict } from "@/components/providers/DictProvider";
import { Minus, Plus } from "@/components/ui/Icons";
import { t } from "@/i18n";
import { formatDay, formatRange } from "@/lib/format";
import { fillPrices } from "@/lib/pricing";
import type { Option, Prices, Session } from "@/lib/types";
import { ModalFrame, Opt, ms as s } from "./ModalFrame";

const MAX_PAIRS = 3;

export function FamilyModal({
  products,
  sessions,
  price,
  prices,
}: {
  products: Option[];
  sessions: Session[];
  price: number;
  prices: Prices;
}) {
  const dict = useDict();
  const d = dict.modal.family;
  const [prod, setProd] = useState(0);
  const [sel, setSel] = useState(0);
  const [n, setN] = useState(1);

  const session = sessions[sel];
  const when = session ? `${formatDay(session.start)} · ${formatRange(session.start, session.end)}` : "дату согласуем";

  const form = useLeadForm("family", (data) => ({
    fields: [
      ["Изделие", products[prod].label],
      ["Дата", when],
      ["Пар", `${n} · от ${n * price} ₾`],
      ["Возраст ребёнка", String(data.get("age") ?? "")],
    ],
    summary: [
      ["Формат", `Для семьи · ${products[prod].label.toLowerCase()}`],
      ["Когда", when],
      ["Участники", `${n} ${n === 1 ? "пара" : "пары"} · от ${n * price} ₾`],
    ],
  }));

  const side = (
    <aside className={s.side}>
      <div className={`ph ${s.sideImg}`} style={{ "--pos": "48% 50%" } as React.CSSProperties}>
        <Image src="/images/family.jpg" alt={dict.family.imgAlt} fill sizes="(max-width: 760px) 100vw, 440px" />
      </div>
      <span className="mono wd">{d.tag}</span>
      <h2 className={s.title} id="modal-title">
        {d.title}
      </h2>
      <p className="txt">{d.text}</p>
      <dl className={s.facts}>
        {d.facts.map(([k, v]) => (
          <div key={k}>
            <dt className="mono">{k}</dt>
            <dd>{fillPrices(v, prices)}</dd>
          </div>
        ))}
      </dl>
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
          <legend>{d.product}</legend>
          <div className={s.opts}>
            {products.map((x, k) => (
              <Opt key={x.id} on={k === prod} onClick={() => setProd(k)}>
                <b>{x.label}</b>
                <span className="mono">{t(d.perPair, { price })}</span>
              </Opt>
            ))}
          </div>
        </fieldset>

        <fieldset className="fs">
          <legend>{d.dates}</legend>
          {!sessions.length && <p className="txt">{d.noDates}</p>}
          <div className={s.opts}>
            {sessions.map((x, k) => (
              <Opt key={x.start} on={k === sel} onClick={() => setSel(k)}>
                <span className="mono">{formatDay(x.start)}</span>
                <b>{formatRange(x.start, x.end)}</b>
              </Opt>
            ))}
          </div>
        </fieldset>

        <div className="two" style={{ alignItems: "end" }}>
          <div className="fs">
            <span className="fs-l" id="fam-pairs">
              {d.pairs}
            </span>
            <div className={s.step} role="group" aria-labelledby="fam-pairs">
              <button type="button" onClick={() => setN(Math.max(1, n - 1))} disabled={n <= 1} aria-label={d.less}>
                <Minus size={18} />
              </button>
              <output aria-live="polite">{n}</output>
              <button type="button" onClick={() => setN(Math.min(MAX_PAIRS, n + 1))} disabled={n >= MAX_PAIRS} aria-label={d.more}>
                <Plus size={18} />
              </button>
            </div>
          </div>
          <label className="fl">
            <span>{d.age}</span>
            <input type="text" name="age" inputMode="numeric" placeholder={d.agePh} />
          </label>
        </div>
        <ContactFields errors={form.errors} clear={form.clear} nameLabel={d.adult} />

        <div className={s.tot}>
          <span className="mono">{t(d.total, { n, price })}</span>
          <span className={s.sum}>{t(d.totalFrom, { sum: n * price })}</span>
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
