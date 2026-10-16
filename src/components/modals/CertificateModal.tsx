"use client";

import { useState } from "react";
import { ContactFields, SendError } from "@/components/forms/Fields";
import { useLeadForm } from "@/components/forms/useLeadForm";
import { useDict } from "@/components/providers/DictProvider";
import { Check } from "@/components/ui/Icons";
import { LogoMark } from "@/components/ui/Logo";
import { t } from "@/i18n";
import type { Masterclass, Option } from "@/lib/types";
import { ModalFrame, Opt, ms as s } from "./ModalFrame";
import c from "./CertificateModal.module.css";

export function CertificateModal({
  masterclasses,
  sums,
  formats,
}: {
  masterclasses: Masterclass[];
  sums: Option[];
  formats: Option[];
}) {
  const dict = useDict();
  const d = dict.modal.cert;
  const [kind, setKind] = useState<"mc" | "sum">("mc");
  const [mcIdx, setMc] = useState(Math.min(3, masterclasses.length - 1));
  const [sumIdx, setSum] = useState(1);
  const [fmtIdx, setFmt] = useState(0);
  const [recipient, setRecipient] = useState("");

  const isMc = kind === "mc";
  const mc = masterclasses[mcIdx];
  const sum = sums[sumIdx];
  const fmt = formats[fmtIdx];
  const what = isMc ? `«${mc.title}»` : t(d.sumWhat, { v: sum.price ?? 0 });
  const total = isMc ? mc.price : (sum.price ?? 0);

  const form = useLeadForm("certificate", (data) => ({
    fields: [
      ["Сертификат", isMc ? `Мастер-класс «${mc.title}»` : `На сумму ${sum.price} ₾`],
      ["Формат", fmt.label],
      ["Кому", String(data.get("recipient") ?? "")],
      ["Пожелание", String(data.get("wish") ?? "")],
      ["К оплате", `${total} ₾`],
    ],
    summary: [
      ["Формат", `Сертификат · ${fmt.label.toLowerCase()}`],
      ["Что", isMc ? `Мастер-класс «${mc.title}»` : `${sum.price} ₾ на любой формат`],
      ["К оплате", `${total} ₾`],
    ],
  }));

  const side = (
    <aside className={`${s.side} ${s.sideDark} ${c.side}`}>
      <span className="mono acc">{d.tag}</span>
      <h2 className={s.title} id="modal-title">
        {d.title}
      </h2>
      <div className={c.cert} role="img" aria-label={`${d.preview}: ${what}`}>
        <div className={c.certH}>
          <span className={c.brand}>
            <LogoMark size={28} tone="dark" />
            <b>{dict.brand.name}</b>
          </span>
          <span className="mono">{d.formatShort[fmt.id] ?? fmt.label}</span>
        </div>
        <div className={c.certB}>
          <span className="mono">{isMc ? d.kindMc : d.kindSum}</span>
          <p className={c.what}>{what}</p>
        </div>
        <div className={`${c.certF} mono`}>
          <span>{t(d.for, { name: recipient.trim() || d.forPh })}</span>
          <span>{d.validShort}</span>
        </div>
      </div>
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

        <div className={s.seg} role="group" aria-label={d.typeLabel}>
          <button type="button" className={isMc ? s.on : undefined} aria-pressed={isMc} onClick={() => setKind("mc")}>
            {d.segMc}
          </button>
          <button type="button" className={!isMc ? s.on : undefined} aria-pressed={!isMc} onClick={() => setKind("sum")}>
            {d.segSum}
          </button>
        </div>

        {isMc ? (
          <div className={s.list} role="group" aria-label={d.segMc}>
            {masterclasses.map((m, k) => (
              <button
                key={m.id}
                type="button"
                className={`${s.row} ${k === mcIdx ? s.on : ""}`}
                aria-pressed={k === mcIdx}
                onClick={() => setMc(k)}
              >
                <b>{m.title}</b>
                <span className="mono">
                  {m.durationShort} · {m.price} ₾
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className={`${s.opts} ${s.optsSm}`} role="group" aria-label={d.segSum}>
            {sums.map((x, k) => (
              <Opt key={x.id} on={k === sumIdx} onClick={() => setSum(k)}>
                <span className={s.big}>{x.price} ₾</span>
                <span className="mono">{x.hint}</span>
              </Opt>
            ))}
          </div>
        )}

        <fieldset className="fs">
          <legend>{d.format}</legend>
          <div className={`${s.opts} ${s.optsSm}`}>
            {formats.map((x, k) => (
              <Opt key={x.id} on={k === fmtIdx} onClick={() => setFmt(k)}>
                <b>{x.label}</b>
                <span className="mono">{x.hint}</span>
              </Opt>
            ))}
          </div>
        </fieldset>

        <label className="fl">
          <span>{d.to}</span>
          <input type="text" name="recipient" placeholder={d.toPh} value={recipient} onChange={(e) => setRecipient(e.target.value)} />
        </label>
        <ContactFields errors={form.errors} clear={form.clear} nameLabel={d.yourName} />
        <label className="fl">
          <span>
            {d.wish}
            {dict.form.optional}
          </span>
          <textarea name="wish" placeholder={d.wishPh} />
        </label>

        <div className={s.tot}>
          <span className="mono">{d.total}</span>
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
