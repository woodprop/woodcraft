"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import type { SaveResult } from "@/app/admin/actions";
import type { FieldErrors } from "@/lib/admin/validate";
import { useToast } from "./Toast";
import s from "./admin.module.css";

type Options<T> = {
  /** что отправить на сервер (по умолчанию — сам черновик) */
  serialize?: (draft: T) => unknown;
  onSaved?: (draft: T) => void;
};

/** Записать значение по пути "a.2.b" в копию объекта */
function setPath<T>(obj: T, path: string, value: unknown): T {
  const copy = structuredClone(obj);
  const keys = path.split(".");
  let cur = copy as Record<string, unknown>;
  for (const k of keys.slice(0, -1)) cur = cur[k] as Record<string, unknown>;
  cur[keys[keys.length - 1]] = value;
  return copy;
}

/**
 * Черновик формы: правки копятся локально, «Сохранить» отправляет их в Server Action.
 * Ошибки приходят с сервера по путям полей и сбрасываются, когда поле меняют.
 */
export function useEditor<T>(initial: T, action: (input: unknown) => Promise<SaveResult>, opts: Options<T> = {}) {
  const [draft, setDraft] = useState(initial);
  const [base, setBase] = useState(initial);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [pending, start] = useTransition();
  const toast = useToast();
  const dirty = JSON.stringify(draft) !== JSON.stringify(base);

  // не даём случайно закрыть вкладку с несохранёнными правками
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  /** изменить одно поле */
  const set = useCallback((path: string, value: unknown) => {
    setDraft((d) => setPath(d, path, value));
    setErrors((e) => {
      if (!(path in e)) return e;
      const next = { ...e };
      delete next[path];
      return next;
    });
  }, []);

  /** изменить структуру (добавить, удалить, переставить) — индексы сдвигаются, поэтому ошибки сбрасываем */
  const edit = useCallback((fn: (d: T) => void) => {
    setDraft((d) => {
      const copy = structuredClone(d);
      fn(copy);
      return copy;
    });
    setErrors({});
  }, []);

  const save = () =>
    start(async () => {
      try {
        const res = await action(opts.serialize ? opts.serialize(draft) : draft);
        if (res.ok) {
          setBase(draft);
          setErrors({});
          toast("Сохранено — изменения уже на сайте");
          opts.onSaved?.(draft);
        } else {
          setErrors(res.errors);
          toast(res.message ?? "Не сохранено: исправьте поля, выделенные красным", true);
        }
      } catch {
        toast("Не удалось сохранить. Проверьте соединение и попробуйте ещё раз", true);
      }
    });

  const reset = () => {
    setDraft(base);
    setErrors({});
  };

  const err = (path: string) => errors[path];

  return { draft, set, edit, save, reset, dirty, pending, errors, err };
}

/** Плавающая панель «Сохранить / Отменить», видна, пока есть несохранённые правки */
export function SaveBar({ editor, label = "Есть несохранённые изменения" }: { editor: { dirty: boolean; pending: boolean; save: () => void; reset: () => void }; label?: string }) {
  if (!editor.dirty && !editor.pending) return null;
  return (
    <div className={s.saveBar} role="region" aria-label="Сохранение изменений">
      <span>{editor.pending ? "Сохраняем…" : label}</span>
      <div className={s.actions}>
        <button type="button" className={`${s.btn} ${s.btnGhost} ${s.btnSm}`} onClick={editor.reset} disabled={editor.pending}>
          Отменить
        </button>
        <button type="button" className={`${s.btn} ${s.btnAcc} ${s.btnSm}`} onClick={editor.save} disabled={editor.pending}>
          Сохранить
        </button>
      </div>
    </div>
  );
}
