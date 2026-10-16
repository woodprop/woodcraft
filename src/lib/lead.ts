// Заявки с сайта: общий формат и валидация (используется и на клиенте, и в API).

export const leadKinds = ["masterclass", "coworking", "certificate", "corporate", "family", "request"] as const;
export type LeadKind = (typeof leadKinds)[number];

export const leadTitles: Record<LeadKind, string> = {
  masterclass: "Запись на мастер-класс",
  coworking: "Бронь коворкинга",
  certificate: "Подарочный сертификат",
  corporate: "Корпоратив",
  family: "Семейный мастер-класс",
  request: "Заявка с сайта",
};

export type Lead = {
  kind: LeadKind;
  name: string;
  phone: string;
  /** человекочитаемые поля «подпись → значение» для письма */
  fields: [string, string][];
  /** honeypot: у людей всегда пустое */
  website?: string;
};

export type LeadErrors = Partial<Record<"name" | "phone", true>>;

const MAX = 600;

export function validateContact(name: string, phone: string): LeadErrors {
  const e: LeadErrors = {};
  if (name.trim().length < 2) e.name = true;
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15) e.phone = true;
  return e;
}

/** Серверная проверка входящих данных: тип, длины, контакты */
export function parseLead(input: unknown): Lead | null {
  if (!input || typeof input !== "object") return null;
  const o = input as Record<string, unknown>;
  if (!leadKinds.includes(o.kind as LeadKind)) return null;
  if (typeof o.name !== "string" || typeof o.phone !== "string") return null;
  if (Object.keys(validateContact(o.name, o.phone)).length) return null;
  if (!Array.isArray(o.fields) || o.fields.length > 20) return null;
  const fields: [string, string][] = [];
  for (const f of o.fields) {
    if (!Array.isArray(f) || f.length !== 2) return null;
    const [k, v] = f;
    if (typeof k !== "string" || typeof v !== "string") return null;
    fields.push([k.slice(0, 80), v.slice(0, MAX)]);
  }
  return {
    kind: o.kind as LeadKind,
    name: o.name.trim().slice(0, 120),
    phone: o.phone.trim().slice(0, 40),
    fields,
  };
}
