import { Suspense } from "react";
import { PageLoading } from "@/components/admin/PageLoading";
import Link from "next/link";
import { notFound } from "next/navigation";
import { McForm } from "@/components/admin/McForm";
import { IBack } from "@/components/admin/icons";
import { repo } from "@/lib/admin";
import { requireAdmin } from "@/lib/admin/auth";
import { imageLibrary } from "@/lib/admin/images";
import { version } from "@/lib/admin/drafts";
import { tbilisiToday } from "@/lib/format";
import type { MasterclassRec } from "@/lib/types";
import s from "@/components/admin/admin.module.css";

const blank: MasterclassRec = {
  id: "",
  title: "",
  desc: "",
  about: "",
  hours: 2,
  price: 40,
  capacity: 6,
  image: { src: "", alt: "" },
  sessions: [],
};

async function McPageContent({ params }: PageProps<"/admin/events/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const data = await repo.load();
  const isNew = id === "new";
  const mc = isNew ? blank : data.masterclasses.find((m) => m.id === id);
  if (!mc) notFound();

  return (
    <>
      <Link href="/admin/events" className={s.back}>
        <IBack size={18} /> Все мастер-классы
      </Link>
      <McForm
        key={version(mc)}
        initial={mc}
        isNew={isNew}
        takenIds={data.masterclasses.map((m) => m.id)}
        library={await imageLibrary(data)}
        today={tbilisiToday()}
      />
    </>
  );
}

// Suspense внутри страницы: при переходе между разделами меню остаётся на месте,
// а вместо содержимого сразу видна заглушка, пока проверяется вход и грузятся данные
export default function McPage(props: PageProps<"/admin/events/[id]">) {
  return (
    <Suspense fallback={<PageLoading />}>
      <McPageContent {...props} />
    </Suspense>
  );
}
