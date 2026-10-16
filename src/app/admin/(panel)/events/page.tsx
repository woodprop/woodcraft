import { Suspense } from "react";
import { PageLoading } from "@/components/admin/PageLoading";
import Link from "next/link";
import { FamilyEditor } from "@/components/admin/FamilyEditor";
import { McList } from "@/components/admin/McList";
import { IPlus } from "@/components/admin/icons";
import { repo } from "@/lib/admin";
import { requireAdmin } from "@/lib/admin/auth";
import { version } from "@/lib/admin/drafts";
import { tbilisiToday } from "@/lib/format";
import s from "@/components/admin/admin.module.css";

async function EventsPageContent() {
  await requireAdmin();
  const data = await repo.load();
  const today = tbilisiToday();
  return (
    <>
      <div className={s.head}>
        <div>
          <h1 className={s.h1}>Мастер-классы и мероприятия</h1>
          <p className={s.sub}>
            Карточки мастер-классов, их даты и свободные места. Порядок здесь такой же, как в карусели на сайте. Прошедшие даты
            исчезают с сайта сами.
          </p>
        </div>
        <Link className={`${s.btn} ${s.btnAcc}`} href="/admin/events/new">
          <IPlus size={18} /> Добавить мастер-класс
        </Link>
      </div>

      <section className={s.card}>
        <McList items={data.masterclasses} today={today} />
      </section>

      <FamilyEditor key={version(data.family)} family={data.family} today={today} />
    </>
  );
}

// Suspense внутри страницы: при переходе между разделами меню остаётся на месте,
// а вместо содержимого сразу видна заглушка, пока проверяется вход и грузятся данные
export default function EventsPage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <EventsPageContent />
    </Suspense>
  );
}
