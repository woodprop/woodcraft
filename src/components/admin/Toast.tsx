"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { ICheck, IInfo } from "./icons";
import s from "./admin.module.css";

type Toast = { id: number; text: string; error?: boolean };
type Show = (text: string, error?: boolean) => void;

const Ctx = createContext<Show>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const show = useCallback<Show>((text, error) => {
    const id = Date.now() + Math.random();
    setItems((xs) => [...xs, { id, text, error }]);
    setTimeout(() => setItems((xs) => xs.filter((x) => x.id !== id)), error ? 6000 : 3500);
  }, []);
  return (
    <Ctx.Provider value={show}>
      {children}
      <div className={s.toasts} role="status" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={`${s.toast} ${t.error ? s.toastErr : ""}`}>
            {t.error ? <IInfo /> : <ICheck />}
            {t.text}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export const useToast = () => useContext(Ctx);
