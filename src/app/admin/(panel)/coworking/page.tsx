import { Suspense } from "react";
import { PageLoading } from "@/components/admin/PageLoading";
import { CoworkingForm } from "@/components/admin/CoworkingForm";
import { repo } from "@/lib/admin";
import { requireAdmin } from "@/lib/admin/auth";
import { version } from "@/lib/admin/drafts";
import { tbilisiToday } from "@/lib/format";

async function CoworkingPageContent() {
  await requireAdmin();
  const { coworking } = await repo.load();
  return <CoworkingForm key={version(coworking)} initial={coworking} today={tbilisiToday()} />;
}

// Suspense внутри страницы: при переходе между разделами меню остаётся на месте,
// а вместо содержимого сразу видна заглушка, пока проверяется вход и грузятся данные
export default function CoworkingPage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <CoworkingPageContent />
    </Suspense>
  );
}
