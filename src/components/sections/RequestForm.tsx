"use client";

import { useState } from "react";
import { ContactFields, SendError } from "@/components/forms/Fields";
import { useLeadForm } from "@/components/forms/useLeadForm";
import { useDict } from "@/components/providers/DictProvider";
import s from "./Request.module.css";

export function RequestForm() {
  const dict = useDict();
  const d = dict.request;
  const [interest, setInterest] = useState(0);
  const { errors, sending, failed, onSubmit, clear } = useLeadForm("request", (data) => {
    const date = String(data.get("date") ?? "");
    return {
      fields: [
        [d.interestLabel, d.interests[interest]],
        [d.dateLabel, date],
      ],
      summary: [
        [d.interestLabel, d.interests[interest]],
        ...(date ? ([[d.dateLabel, date]] as [string, string][]) : []),
      ],
    };
  });

  return (
    <form className={`${s.form} on-light`} aria-labelledby="contacts-h" onSubmit={onSubmit} noValidate>
      <ContactFields errors={errors} clear={clear} />
      <fieldset className="fs">
        <legend>{d.interestLabel}</legend>
        <div className={s.chips}>
          {d.interests.map((label, k) => (
            <button
              key={label}
              type="button"
              className={k === interest ? s.on : undefined}
              aria-pressed={k === interest}
              onClick={() => setInterest(k)}
            >
              {label}
            </button>
          ))}
        </div>
      </fieldset>
      <label className="fl">
        <span>{d.dateLabel}</span>
        <input type="text" name="date" placeholder={d.datePh} />
      </label>
      <SendError show={failed} />
      <button className={`btn btn-a ${s.submit}`} type="submit" disabled={sending}>
        {sending ? dict.form.sending : d.submit}
      </button>
      <p className="legal">{d.legal}</p>
    </form>
  );
}
