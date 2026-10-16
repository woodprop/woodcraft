"use client";

import { useTransition } from "react";
import { resetDemo } from "@/app/admin/actions";
import { useToast } from "./Toast";
import s from "./admin.module.css";

export function ResetDemo() {
  const [pending, start] = useTransition();
  const toast = useToast();
  return (
    <button
      type="button"
      className={`${s.btn} ${s.btnGhost} ${s.btnSm}`}
      style={{ marginTop: 10 }}
      disabled={pending}
      onClick={() => {
        if (!confirm("Вернуть все данные к исходным? Все изменения, сделанные в админке, пропадут.")) return;
        start(async () => {
          await resetDemo();
          toast("Данные возвращены к исходным");
        });
      }}
    >
      {pending ? "Возвращаем…" : "Вернуть исходные данные"}
    </button>
  );
}
