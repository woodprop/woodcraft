"use client";

import { addDays, addMinutes, toMinutes, type SessionDraft } from "@/lib/admin/drafts";
import { formatDay } from "@/lib/format";
import { IPlus, ITrash } from "./icons";
import { NumberInput } from "./ui";
import s from "./admin.module.css";

type Props = {
  sessions: SessionDraft[];
  /** путь к списку в черновике — для ошибок и set() */
  path: string;
  set: (path: string, value: unknown) => void;
  replace: (list: SessionDraft[]) => void;
  err: (path: string) => string | undefined;
  /** максимум мест (размер группы) */
  capacity: number;
  /** сколько свободных мест у новой даты (по умолчанию — вся группа) */
  defaultSeats?: number;
  /** длительность по умолчанию для новой даты, в минутах */
  minutes: number;
  today: string;
};

/** Список дат занятия: день, начало, конец, свободные места */
export function SessionsEditor({ sessions, path, set, replace, err, capacity, defaultSeats = capacity, minutes, today }: Props) {
  const past = sessions.filter((x) => x.date && x.date < today).length;

  const add = () => {
    const last = sessions[sessions.length - 1];
    const date = last?.date && last.date >= today ? addDays(last.date, 7) : addDays(today, 7);
    const from = last?.from ?? "12:00";
    replace([...sessions, { date, from, end: addMinutes(from, minutes), seatsLeft: defaultSeats }]);
  };

  // при смене начала сдвигаем конец, сохраняя длительность
  const setFrom = (i: number, from: string) => {
    const x = sessions[i];
    const dur = x.from && x.end ? toMinutes(x.end) - toMinutes(x.from) : minutes;
    set(`${path}.${i}.from`, from);
    if (from && dur > 0) set(`${path}.${i}.end`, addMinutes(from, dur));
  };

  return (
    <div className={s.sessions}>
      {sessions.length > 0 && (
        <div className={s.sessionsHead} aria-hidden="true">
          <span>Дата</span>
          <span>Начало</span>
          <span>Конец</span>
          <span>Свободно мест</span>
          <span />
        </div>
      )}
      {sessions.map((x, i) => {
        const p = `${path}.${i}`;
        const isPast = !!x.date && x.date < today;
        const e = err(`${p}.date`) || err(`${p}.from`) || err(`${p}.end`) || err(`${p}.seatsLeft`);
        return (
          <div key={i} className={`${s.session} ${isPast ? s.sessionPast : ""}`}>
            <div>
              <span className={s.mLabel}>Дата</span>
              <input
                type="date"
                className={`${s.input} ${s.inputSm}`}
                value={x.date}
                min={today}
                aria-label={`Дата ${i + 1}`}
                aria-invalid={!!err(`${p}.date`)}
                onChange={(ev) => set(`${p}.date`, ev.target.value)}
              />
            </div>
            <div>
              <span className={s.mLabel}>Начало</span>
              <input
                type="time"
                step={900}
                className={`${s.input} ${s.inputSm}`}
                value={x.from}
                aria-label={`Начало ${i + 1}`}
                aria-invalid={!!err(`${p}.from`)}
                onChange={(ev) => setFrom(i, ev.target.value)}
              />
            </div>
            <div>
              <span className={s.mLabel}>Конец</span>
              <input
                type="time"
                step={900}
                className={`${s.input} ${s.inputSm}`}
                value={x.end}
                aria-label={`Конец ${i + 1}`}
                aria-invalid={!!err(`${p}.end`)}
                onChange={(ev) => set(`${p}.end`, ev.target.value)}
              />
            </div>
            <div>
              <span className={s.mLabel}>Свободно мест</span>
              <NumberInput
                small
                value={x.seatsLeft}
                min={0}
                max={capacity}
                label={`Свободно мест, дата ${i + 1}`}
                invalid={!!err(`${p}.seatsLeft`)}
                onChange={(v) => set(`${p}.seatsLeft`, v)}
              />
            </div>
            <button
              type="button"
              className={`${s.icb} ${s.icbDanger}`}
              aria-label={`Удалить дату ${i + 1}`}
              title="Удалить дату"
              onClick={() => replace(sessions.filter((_, k) => k !== i))}
            >
              <ITrash />
            </button>
            {(e || isPast || x.seatsLeft === 0) && (
              <span className={`${s.sessionNote} ${e ? s.errText : s.hint}`}>
                {e ??
                  (isPast
                    ? `${formatDay(`${x.date}T00:00`)} уже прошло — на сайте не показывается`
                    : "Мест нет — на сайте дата видна, но записаться нельзя")}
              </span>
            )}
          </div>
        );
      })}
      {!sessions.length && <p className={s.empty}>Дат пока нет — на сайте будет написано, что даты скоро появятся.</p>}
      {err(path) && <span className={s.errText}>{err(path)}</span>}
      <div className={s.actions} style={{ marginTop: 6 }}>
        <button type="button" className={`${s.btn} ${s.btnGhost} ${s.btnSm}`} onClick={add}>
          <IPlus size={18} /> Добавить дату
        </button>
        {past > 0 && (
          <button
            type="button"
            className={`${s.btn} ${s.btnGhost} ${s.btnSm}`}
            onClick={() => replace(sessions.filter((x) => !x.date || x.date >= today))}
          >
            Убрать прошедшие ({past})
          </button>
        )}
      </div>
    </div>
  );
}
