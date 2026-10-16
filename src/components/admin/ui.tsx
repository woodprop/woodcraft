"use client";

import { useId, type ReactNode } from "react";
import s from "./admin.module.css";

export function PageHead({ title, sub, children }: { title: string; sub?: ReactNode; children?: ReactNode }) {
  return (
    <div className={s.head}>
      <div>
        <h1 className={s.h1}>{title}</h1>
        {sub && <p className={s.sub}>{sub}</p>}
      </div>
      {children && <div className={s.actions}>{children}</div>}
    </div>
  );
}

type FieldProps = {
  label: string;
  hint?: ReactNode;
  error?: string;
  children: (id: string, describedBy: string | undefined) => ReactNode;
  className?: string;
};

/** Подпись + поле + подсказка + ошибка */
export function Field({ label, hint, error, children, className }: FieldProps) {
  const id = useId();
  const desc = error ? `${id}-e` : hint ? `${id}-h` : undefined;
  return (
    <div className={[s.field, className].filter(Boolean).join(" ")}>
      <label className={s.label} htmlFor={id}>
        {label}
      </label>
      {children(id, desc)}
      {error ? (
        <span className={s.errText} id={`${id}-e`} role="alert">
          {error}
        </span>
      ) : (
        hint && (
          <span className={s.hint} id={`${id}-h`}>
            {hint}
          </span>
        )
      )}
    </div>
  );
}

function Counter({ len, max, good }: { len: number; max: number; good?: [number, number] }) {
  let cls = s.counter;
  if (len > max) cls += ` ${s.counterBad}`;
  else if (good && (len < good[0] || len > good[1])) cls += ` ${s.counterWarn}`;
  return <span className={cls}>{good ? `${len} символов · лучше ${good[0]}–${good[1]}` : `${len} / ${max}`}</span>;
}

export function TextField({
  label,
  value,
  onChange,
  error,
  hint,
  max,
  good,
  multiline,
  rows,
  placeholder,
  className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  hint?: ReactNode;
  max?: number;
  /** рекомендуемая длина — счётчик подсвечивает выход за рамки */
  good?: [number, number];
  multiline?: boolean;
  rows?: number;
  placeholder?: string;
  className?: string;
}) {
  return (
    <Field label={label} hint={hint} error={error} className={className}>
      {(id, desc) => (
        <>
          {multiline ? (
            <textarea
              id={id}
              className={s.input}
              value={value}
              rows={rows}
              placeholder={placeholder}
              aria-invalid={!!error}
              aria-describedby={desc}
              onChange={(e) => onChange(e.target.value)}
            />
          ) : (
            <input
              id={id}
              className={s.input}
              value={value}
              placeholder={placeholder}
              aria-invalid={!!error}
              aria-describedby={desc}
              onChange={(e) => onChange(e.target.value)}
            />
          )}
          {max && <Counter len={value.length} max={max} good={good} />}
        </>
      )}
    </Field>
  );
}

/** Числовое поле. Пустое значение хранится как NaN — сервер ответит «Укажите …» */
export function NumberField({
  label,
  value,
  onChange,
  error,
  hint,
  suffix,
  min = 0,
  max,
  step = 1,
  className,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  error?: string;
  hint?: ReactNode;
  suffix?: string;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}) {
  return (
    <Field label={label} hint={hint} error={error} className={className}>
      {(id, desc) => (
        <div className={s.affix}>
          <NumberInput id={id} value={value} onChange={onChange} min={min} max={max} step={step} invalid={!!error} describedBy={desc} />
          {suffix && <span>{suffix}</span>}
        </div>
      )}
    </Field>
  );
}

export function NumberInput({
  id,
  value,
  onChange,
  min = 0,
  max,
  step = 1,
  invalid,
  describedBy,
  small,
  label,
}: {
  id?: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  invalid?: boolean;
  describedBy?: string;
  small?: boolean;
  label?: string;
}) {
  return (
    <input
      id={id}
      type="number"
      inputMode={step < 1 ? "decimal" : "numeric"}
      className={`${s.input} ${small ? s.inputSm : ""}`}
      value={Number.isFinite(value) ? value : ""}
      min={min}
      max={max}
      step={step}
      aria-label={label}
      aria-invalid={invalid}
      aria-describedby={describedBy}
      onChange={(e) => onChange(e.target.value === "" ? NaN : Number(e.target.value))}
    />
  );
}

export function SelectField({
  label,
  value,
  onChange,
  options,
  error,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  error?: string;
  hint?: ReactNode;
}) {
  return (
    <Field label={label} hint={hint} error={error}>
      {(id, desc) => (
        <select id={id} className={s.input} value={value} aria-invalid={!!error} aria-describedby={desc} onChange={(e) => onChange(e.target.value)}>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )}
    </Field>
  );
}

export function Switch({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: ReactNode }) {
  return (
    <label className={s.switch}>
      <input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <i aria-hidden="true" />
      <span>{children}</span>
    </label>
  );
}

export function IconButton({
  label,
  onClick,
  children,
  danger,
  disabled,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className={`${s.icb} ${danger ? s.icbDanger : ""}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
    >
      {children}
    </button>
  );
}

export function Badge({ children, tone }: { children: ReactNode; tone?: "ok" | "warn" | "err" }) {
  const cls = tone === "ok" ? s.badgeOk : tone === "warn" ? s.badgeWarn : tone === "err" ? s.badgeErr : "";
  return <span className={`${s.badge} ${cls}`}>{children}</span>;
}
