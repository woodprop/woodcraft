"use client";

import Image from "next/image";
import Link from "next/link";
import { useTransition } from "react";
import { moveMasterclass, setMasterclassHidden } from "@/app/admin/actions";
import { formatDateTime, formatHours } from "@/lib/format";
import type { MasterclassRec } from "@/lib/types";
import { IDown, IEdit, IEye, IEyeOff, IUp } from "./icons";
import { Badge, IconButton } from "./ui";
import { useToast } from "./Toast";
import s from "./admin.module.css";

export function McList({ items, today }: { items: MasterclassRec[]; today: string }) {
  const [pending, start] = useTransition();
  const toast = useToast();

  const run = (fn: () => Promise<void>, msg: string) =>
    start(async () => {
      try {
        await fn();
        toast(msg);
      } catch {
        toast("Не удалось сохранить. Попробуйте ещё раз", true);
      }
    });

  if (!items.length) return <p className={s.empty}>Мастер-классов пока нет.</p>;

  return (
    <ul className={s.list} aria-busy={pending}>
      {items.map((m, i) => {
        const future = m.sessions.filter((x) => x.start.slice(0, 10) >= today);
        const next = future[0];
        return (
          <li key={m.id} className={`${s.item} ${m.hidden ? s.itemHidden : ""}`}>
            <div className={s.thumb}>
              <Image src={m.image.src} alt="" fill sizes="72px" style={{ objectPosition: m.image.pos }} />
            </div>
            <div className={s.itemBody}>
              <div className={s.actions} style={{ gap: 8 }}>
                <Link href={`/admin/events/${m.id}`} className={s.itemTitle}>
                  {m.title}
                </Link>
                {m.hidden && <Badge>Скрыт с сайта</Badge>}
                {!m.hidden && !next && <Badge tone="warn">Нет ближайших дат</Badge>}
              </div>
              <div className={s.itemMeta}>
                <span>{formatHours(m.hours).long}</span>
                <span>{m.price} ₾</span>
                <span>до {m.capacity} человек</span>
                {next && (
                  <span>
                    Ближайшая: {formatDateTime(next.start)} · {next.seatsLeft ? `свободно ${next.seatsLeft}` : "мест нет"}
                  </span>
                )}
                {future.length > 1 && <span>ещё дат: {future.length - 1}</span>}
              </div>
            </div>
            <div className={s.itemSide}>
              <IconButton label="Поднять выше" disabled={pending || i === 0} onClick={() => run(() => moveMasterclass(m.id, -1), "Порядок изменён")}>
                <IUp />
              </IconButton>
              <IconButton
                label="Опустить ниже"
                disabled={pending || i === items.length - 1}
                onClick={() => run(() => moveMasterclass(m.id, 1), "Порядок изменён")}
              >
                <IDown />
              </IconButton>
              <IconButton
                label={m.hidden ? "Показать на сайте" : "Скрыть с сайта"}
                disabled={pending}
                onClick={() =>
                  run(() => setMasterclassHidden(m.id, !m.hidden), m.hidden ? "Мастер-класс снова на сайте" : "Мастер-класс скрыт с сайта")
                }
              >
                {m.hidden ? <IEyeOff /> : <IEye />}
              </IconButton>
              <Link href={`/admin/events/${m.id}`} className={`${s.btn} ${s.btnGhost} ${s.btnSm}`}>
                <IEdit size={18} /> Изменить
              </Link>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
