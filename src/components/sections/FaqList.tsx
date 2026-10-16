"use client";

import { useId, useState } from "react";
import { Plus } from "@/components/ui/Icons";
import type { Faq } from "@/lib/types";
import s from "./Faq.module.css";

/** Аккордеон: открыт один вопрос за раз, по умолчанию — первый */
export function FaqList({ items }: { items: Faq[] }) {
  const [open, setOpen] = useState(0);
  const uid = useId();
  return (
    <div className={s.faq}>
      {items.map((f, k) => {
        const isOpen = open === k;
        const id = `${uid}-${k}`;
        return (
          <div className={`${s.fq} ${isOpen ? s.open : ""}`} key={f.q}>
            <h3>
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={id}
                onClick={() => setOpen(isOpen ? -1 : k)}
              >
                {f.q}
                <span className={s.pl} aria-hidden="true">
                  <Plus size={18} />
                </span>
              </button>
            </h3>
            <div className={s.ansWrap} id={id} role="region" inert={!isOpen}>
              <div className={s.ansIn}>
                <p className={s.ans}>
                  {f.a}
                  {f.todo && (
                    <>
                      {" "}
                      <span className="todo">{f.todo}</span>
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
