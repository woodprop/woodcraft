"use client";

import Image from "next/image";
import { useState } from "react";
import { ContactFields, SendError } from "@/components/forms/Fields";
import { useLeadForm } from "@/components/forms/useLeadForm";
import { useDict } from "@/components/providers/DictProvider";
import { Check, Info } from "@/components/ui/Icons";
import type { Option } from "@/lib/types";
import { ModalFrame, Opt, ms as s } from "./ModalFrame";

export function CorporateModal({ sizes, products }: { sizes: Option[]; products: Option[] }) {
  const dict = useDict();
  const d = dict.modal.corp;
  const [size, setSize] = useState(1);
  const [prod, setProd] = useState(0);

  const form = useLeadForm("corporate", (data) => ({
    fields: [
      ["Компания", String(data.get("company") ?? "")],
      ["Человек", sizes[size].label],
      ["Изделие", products[prod].label],
      ["Желаемая дата", String(data.get("date") ?? "")],
      ["Пожелания", String(data.get("wishes") ?? "")],
    ],
    summary: [
      ["Формат", "Корпоратив"],
      ["Команда", `${sizes[size].label} человек`],
      ["Изделие", products[prod].label],
    ],
  }));

  const side = (
    <aside className={s.side}>
      <div className={`ph ${s.sideImg}`} style={{ "--pos": "50% 40%" } as React.CSSProperties}>
        <Image src="/images/corporate.jpg" alt={dict.corporate.imgAlt} fill sizes="(max-width: 760px) 100vw, 440px" />
      </div>
      <span className="mono wd">{d.tag}</span>
      <h2 className={s.title} id="modal-title">
        {d.title}
      </h2>
      <ul className={s.chk}>
        {d.points.map((p) => (
          <li key={p}>
            <Check size={18} />
            {p}
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
          <p className={s.formTitle}>{d.formTitle}</p>
        </div>

        <fieldset className="fs">
          <legend>{d.size}</legend>
          <div className={`${s.opts} ${s.optsSm}`}>
            {sizes.map((x, k) => (
              <Opt key={x.id} on={k === size} onClick={() => setSize(k)}>
                <b>{x.label}</b>
                <span className="mono">{x.hint}</span>
              </Opt>
            ))}
          </div>
        </fieldset>

        <fieldset className="fs">
          <legend>{d.product}</legend>
          <div className={s.opts}>
            {products.map((x, k) => (
              <Opt key={x.id} on={k === prod} onClick={() => setProd(k)}>
                <b>{x.label}</b>
                <span className="mono">{x.hint}</span>
              </Opt>
            ))}
          </div>
        </fieldset>

        <div className="two">
          <label className="fl">
            <span>{d.date}</span>
            <input type="text" name="date" placeholder={d.datePh} />
          </label>
          <label className="fl">
            <span>{d.company}</span>
            <input type="text" name="company" placeholder={d.companyPh} autoComplete="organization" />
          </label>
        </div>
        <ContactFields errors={form.errors} clear={form.clear} nameLabel={d.contact} />
        <label className="fl">
          <span>
            {d.wishes}
            {dict.form.optional}
          </span>
          <textarea name="wishes" placeholder={d.wishesPh} />
        </label>

        <p className={s.note}>
          <Info size={20} />
          <span>{d.note}</span>
        </p>
        <SendError show={form.failed} />
        <button className={`btn btn-a ${s.submit}`} type="submit" disabled={form.sending}>
          {form.sending ? dict.form.sending : d.submit}
        </button>
        <p className="legal">{d.legal}</p>
      </form>
    </ModalFrame>
  );
}
