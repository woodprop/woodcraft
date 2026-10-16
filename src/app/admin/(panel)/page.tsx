import { Suspense } from "react";
import { PageLoading } from "@/components/admin/PageLoading";
import Link from "next/link";
import { ResetDemo } from "@/components/admin/ResetDemo";
import { IInfo } from "@/components/admin/icons";
import { repo } from "@/lib/admin";
import { requireAdmin } from "@/lib/admin/auth";
import { formatDay, formatRange, tbilisiToday } from "@/lib/format";
import { fillPrices, getPrices } from "@/lib/pricing";
import { hoursLines } from "@/lib/schedule";
import s from "@/components/admin/admin.module.css";

async function DashboardContent() {
  await requireAdmin();
  const data = await repo.load();
  const today = tbilisiToday();
  const prices = getPrices(data);

  const upcoming = [
    ...data.masterclasses
      .filter((m) => !m.hidden)
      .flatMap((m) => m.sessions.map((x) => ({ ...x, title: m.title, capacity: m.capacity, href: `/admin/events/${m.id}` }))),
    ...data.family.sessions.map((x) => ({ ...x, title: "Для семьи", capacity: 0, href: "/admin/events#family" })),
  ]
    .filter((x) => x.start.slice(0, 10) >= today)
    .sort((a, b) => a.start.localeCompare(b.start));

  const visibleMc = data.masterclasses.filter((m) => !m.hidden);
  const noDates = visibleMc.filter((m) => !m.sessions.some((x) => x.start.slice(0, 10) >= today));

  return (
    <>
      <div className={s.head}>
        <div>
          <h1 className={s.h1}>Добрый день!</h1>
          <p className={s.sub}>Здесь всё, что меняется на сайте регулярно. Изменения появляются на сайте сразу после сохранения.</p>
        </div>
      </div>

      {repo.demo && (
        <div className={s.notice}>
          <IInfo />
          <div>
            <p>
              <b>Демо-режим.</b> База данных пока не подключена: изменения хранятся в памяти сервера и пропадут после его перезапуска.
            </p>
            <ResetDemo />
          </div>
        </div>
      )}

      <div className={s.stats}>
        <Link className={s.stat} href="/admin/events">
          <span className={s.mono}>Мастер-классы</span>
          <b>{visibleMc.length}</b>
          <span className={s.small}>{data.masterclasses.length - visibleMc.length ? `+ ${data.masterclasses.length - visibleMc.length} скрыто` : "все на сайте"}</span>
        </Link>
        <Link className={s.stat} href="/admin/events">
          <span className={s.mono}>Ближайшие даты</span>
          <b>{upcoming.length}</b>
          <span className={s.small}>{upcoming.filter((x) => x.seatsLeft === 0).length} без свободных мест</span>
        </Link>
        <Link className={s.stat} href="/admin/gallery">
          <span className={s.mono}>Работы в галерее</span>
          <b>{data.gallery.items.filter((g) => !g.hidden).length}</b>
          <span className={s.small}>на сайте</span>
        </Link>
        <Link className={s.stat} href="/admin/reviews">
          <span className={s.mono}>Отзывы</span>
          <b>{data.reviews.filter((r) => !r.hidden).length}</b>
          <span className={s.small}>на сайте</span>
        </Link>
      </div>

      {noDates.length > 0 && (
        <div className={s.notice}>
          <IInfo />
          <p>
            Нет ближайших дат: {noDates.map((m, i) => (
              <span key={m.id}>
                {i > 0 && ", "}
                <Link href={`/admin/events/${m.id}`}>{m.title}</Link>
              </span>
            ))}
            . На сайте у них будет написано «даты скоро появятся».
          </p>
        </div>
      )}

      <section className={s.card}>
        <div className={s.cardHead}>
          <h2 className={s.h2}>Ближайшие занятия</h2>
          <Link className={`${s.btn} ${s.btnGhost} ${s.btnSm}`} href="/admin/events">
            Все мастер-классы
          </Link>
        </div>
        {upcoming.length ? (
          <div className={s.tableWrap}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th>Когда</th>
                  <th>Занятие</th>
                  <th>Свободно</th>
                </tr>
              </thead>
              <tbody>
                {upcoming.slice(0, 8).map((x) => (
                  <tr key={x.title + x.start}>
                    <td style={{ whiteSpace: "nowrap" }}>
                      {formatDay(x.start)} · {formatRange(x.start, x.end)}
                    </td>
                    <td>
                      <Link href={x.href}>{x.title}</Link>
                    </td>
                    <td>
                      {x.seatsLeft === 0 ? (
                        <span className={`${s.badge} ${s.badgeErr}`}>мест нет</span>
                      ) : x.seatsLeft <= 2 ? (
                        <span className={`${s.badge} ${s.badgeWarn}`}>осталось {x.seatsLeft}</span>
                      ) : (
                        <span className={`${s.badge} ${s.badgeOk}`}>{x.capacity ? `${x.seatsLeft} из ${x.capacity}` : x.seatsLeft}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className={s.empty}>Ближайших занятий нет.</p>
        )}
      </section>

      <section className={s.card}>
        <h2 className={s.h2} style={{ marginBottom: 16 }}>
          Сейчас на сайте
        </h2>
        <div className={s.grid3}>
          <div>
            <p className={s.mono}>Цены</p>
            <p>Мастер-классы от {prices.mcFrom} ₾</p>
            <p>Коворкинг от {prices.cwFrom} ₾</p>
            <p>Для семьи от {prices.familyFrom} ₾</p>
            <Link href="/admin/prices" className={s.small}>
              Изменить цены
            </Link>
          </div>
          <div>
            <p className={s.mono}>Часы работы</p>
            {hoursLines(data.coworking.week).map(([d, t]) => (
              <p key={d}>
                {d}: {t}
              </p>
            ))}
            <Link href="/admin/coworking" className={s.small}>
              Изменить расписание
            </Link>
          </div>
          <div>
            <p className={s.mono}>Заголовок в Google</p>
            <p>{fillPrices(data.seo.title, prices)}</p>
            <Link href="/admin/seo" className={s.small}>
              Изменить SEO
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

// Suspense внутри страницы: при переходе между разделами меню остаётся на месте,
// а вместо содержимого сразу видна заглушка, пока проверяется вход и грузятся данные
export default function Dashboard() {
  return (
    <Suspense fallback={<PageLoading />}>
      <DashboardContent />
    </Suspense>
  );
}
