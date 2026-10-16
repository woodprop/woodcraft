import s from "./admin.module.css";

/** Заглушка, пока страница админки проверяет вход и загружает данные */
export function PageLoading() {
  return (
    <div className={s.loading} aria-busy="true" aria-label="Загрузка">
      <div className={s.skel} style={{ height: 48, width: "40%" }} />
      <div className={s.skel} />
      <div className={s.skel} />
      <div className={s.skel} />
    </div>
  );
}
