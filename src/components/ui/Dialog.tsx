"use client";

import { useEffect, useRef, type ReactNode } from "react";
import styles from "./Dialog.module.css";

type Props = {
  open: boolean;
  onClose: () => void;
  labelledBy?: string;
  label?: string;
  /** "modal" — карточка на затемнении, "menu" — полноэкранная тёмная панель */
  variant?: "modal" | "menu";
  className?: string;
  children: ReactNode;
};

const CLOSE_MS = 200;

/**
 * Нативный <dialog>: фокус-ловушка, Esc, inert для фона.
 * Добавляет анимацию открытия/закрытия и блокировку прокрутки страницы.
 */
export function Dialog({ open, onClose, labelledBy, label, variant = "modal", className, children }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      d.removeAttribute("data-closing");
      d.showModal();
      d.scrollTop = 0;
      document.documentElement.classList.add("no-scroll");
      document.body.classList.add("no-scroll");
    } else if (!open && d.open) {
      d.setAttribute("data-closing", "");
      const t = window.setTimeout(() => {
        d.close();
        d.removeAttribute("data-closing");
      }, CLOSE_MS);
      return () => window.clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    const onDialogClose = () => {
      document.documentElement.classList.remove("no-scroll");
      document.body.classList.remove("no-scroll");
    };
    // Esc: перехватываем, чтобы закрыть с анимацией через состояние
    const onCancel = (e: Event) => {
      e.preventDefault();
      onCloseRef.current();
    };
    d.addEventListener("close", onDialogClose);
    d.addEventListener("cancel", onCancel);
    return () => {
      d.removeEventListener("close", onDialogClose);
      d.removeEventListener("cancel", onCancel);
      onDialogClose();
    };
  }, []);

  return (
    <dialog
      ref={ref}
      className={[styles.dialog, styles[variant], className].filter(Boolean).join(" ")}
      aria-labelledby={labelledBy}
      aria-label={label}
      onClick={(e) => {
        // клик по затемнению (вне содержимого) закрывает модалку
        if (variant === "modal" && e.target === e.currentTarget) onClose();
      }}
    >
      {children}
    </dialog>
  );
}
