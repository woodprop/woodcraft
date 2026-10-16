"use client";

import { useDict } from "@/components/providers/DictProvider";
import type { LeadErrors } from "@/lib/lead";

type Props = {
  errors: LeadErrors;
  clear: (f: keyof LeadErrors) => () => void;
  nameLabel?: string;
};

/** Пара «Имя + Телефон» с ошибками — есть во всех формах */
export function ContactFields({ errors, clear, nameLabel }: Props) {
  const f = useDict().form;
  return (
    <div className="two">
      <label className={`fl${errors.name ? " err" : ""}`}>
        <span>{nameLabel ?? f.name}</span>
        <input
          type="text"
          name="name"
          placeholder={f.namePh}
          autoComplete="name"
          required
          aria-invalid={errors.name ? true : undefined}
          onInput={clear("name")}
        />
        {errors.name && <span className="err-msg">{f.errName}</span>}
      </label>
      <label className={`fl${errors.phone ? " err" : ""}`}>
        <span>{f.phone}</span>
        <input
          type="tel"
          name="phone"
          placeholder={f.phonePh}
          autoComplete="tel"
          inputMode="tel"
          required
          aria-invalid={errors.phone ? true : undefined}
          onInput={clear("phone")}
        />
        {errors.phone && <span className="err-msg">{f.errPhone}</span>}
      </label>
      {/* ловушка для ботов: люди это поле не видят и не заполняют */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="sr-only" />
    </div>
  );
}

export function SendError({ show }: { show: boolean }) {
  const f = useDict().form;
  if (!show) return null;
  return (
    <p className="form-err" role="alert">
      {f.errSend}
    </p>
  );
}
