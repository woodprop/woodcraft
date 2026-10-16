import { Suspense } from "react";
import { PageLoading } from "@/components/admin/PageLoading";
import { ReviewsEditor } from "@/components/admin/ReviewsEditor";
import { repo } from "@/lib/admin";
import { requireAdmin } from "@/lib/admin/auth";
import { version } from "@/lib/admin/drafts";

async function ReviewsPageContent() {
  await requireAdmin();
  const { reviews } = await repo.load();
  return <ReviewsEditor key={version(reviews)} initial={reviews} />;
}

// Suspense внутри страницы: при переходе между разделами меню остаётся на месте,
// а вместо содержимого сразу видна заглушка, пока проверяется вход и грузятся данные
export default function ReviewsPage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <ReviewsPageContent />
    </Suspense>
  );
}
