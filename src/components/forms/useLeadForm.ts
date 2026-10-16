"use client";

import { useState, type FormEvent } from "react";
import { useBooking, type SummaryRow } from "@/components/providers/BookingProvider";
import { validateContact, type LeadErrors, type LeadKind } from "@/lib/lead";

type Build = (form: FormData) => { fields: [string, string][]; summary: SummaryRow[] };

/**
 * Общая логика форм: проверка имени/телефона, отправка, ошибки.
 * Поля name и phone берутся из инпутов с такими именами.
 */
export function useLeadForm(kind: LeadKind, build: Build) {
  const { submitLead } = useBooking();
  const [errors, setErrors] = useState<LeadErrors>({});
  const [sending, setSending] = useState(false);
  const [failed, setFailed] = useState(false);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name") ?? "");
    const phone = String(data.get("phone") ?? "");
    const errs = validateContact(name, phone);
    setErrors(errs);
    setFailed(false);
    if (Object.keys(errs).length) {
      form.querySelector<HTMLInputElement>(`[name="${errs.name ? "name" : "phone"}"]`)?.focus();
      return;
    }
    const { fields, summary } = build(data);
    // пустые необязательные поля в письмо не отправляем
    const filled = fields.filter(([, v]) => v.trim() !== "");
    setSending(true);
    const website = String(data.get("website") ?? "");
    const ok = await submitLead({ kind, name, phone, fields: filled, website }, summary);
    setSending(false);
    if (ok) form.reset();
    else setFailed(true);
  };

  const clear = (field: keyof LeadErrors) => () => {
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  };

  return { errors, sending, failed, onSubmit, clear };
}
