import { Suspense } from "react";
import { PageLoading } from "@/components/admin/PageLoading";
import { PricesForm } from "@/components/admin/PricesForm";
import { repo } from "@/lib/admin";
import { requireAdmin } from "@/lib/admin/auth";
import { version } from "@/lib/admin/drafts";

async function PricesPageContent() {
  await requireAdmin();
  const data = await repo.load();
  const initial = {
    masterclasses: data.masterclasses.map((m) => ({ id: m.id, title: m.title, price: m.price, hidden: !!m.hidden })),
    tariffs: data.tariffs,
    familyPrice: data.family.price,
    certificateSums: data.certificateSums,
  };
  return <PricesForm key={version(initial)} initial={initial} />;
}

// Suspense внутри страницы: при переходе между разделами меню остаётся на месте,
// а вместо содержимого сразу видна заглушка, пока проверяется вход и грузятся данные
export default function PricesPage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <PricesPageContent />
    </Suspense>
  );
}
