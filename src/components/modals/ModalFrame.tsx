"use client";

import type { ReactNode } from "react";
import { useBooking } from "@/components/providers/BookingProvider";
import { useDict } from "@/components/providers/DictProvider";
import { Close } from "@/components/ui/Icons";
import s from "./Modal.module.css";

/** Карточка модалки с кнопкой закрытия: side — колонка с описанием, children — форма */
export function ModalFrame({ side, children, narrow }: { side?: ReactNode; children: ReactNode; narrow?: boolean }) {
  const { close } = useBooking();
  const d = useDict().modal;
  return (
    <div className={`${s.card} ${narrow ? s.narrow : ""}`}>
      <button type="button" className={s.x} onClick={close} aria-label={d.close}>
        <Close />
      </button>
      {side}
      {children}
    </div>
  );
}

/** Кнопка-вариант (дата, тариф, изделие…) */
export function Opt({
  on,
  onClick,
  children,
  className,
  disabled,
}: {
  on: boolean;
  onClick: () => void;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className={[s.opt, on && s.on, className].filter(Boolean).join(" ")}
      aria-pressed={on}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

export { s as ms };
