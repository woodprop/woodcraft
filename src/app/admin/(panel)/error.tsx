"use client";

import { useEffect } from "react";
import { IInfo } from "@/components/admin/icons";
import s from "@/components/admin/admin.module.css";

/** Ошибка загрузки раздела — чаще всего база данных недоступна (например, проект Supabase на паузе) */
export default function AdminError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <>
      <div className={s.head}>
        <h1 className={s.h1}>Не удалось загрузить данные</h1>
      </div>
      <div className={s.notice}>
        <IInfo />
        <div>
          <p>Скорее всего, база данных недоступна. Сайт для посетителей продолжает работать с последними сохранёнными данными.</p>
          <p>Попробуйте ещё раз через минуту. Если ошибка повторяется — проверьте, не стоит ли проект на паузе в панели Supabase.</p>
        </div>
      </div>
      <button type="button" className={`${s.btn} ${s.btnAcc}`} onClick={() => retry()}>
        Попробовать ещё раз
      </button>
    </>
  );
}
