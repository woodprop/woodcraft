import { Suspense } from "react";
import { PageLoading } from "@/components/admin/PageLoading";
import { SeoForm } from "@/components/admin/SeoForm";
import { repo } from "@/lib/admin";
import { requireAdmin } from "@/lib/admin/auth";
import { version } from "@/lib/admin/drafts";
import { getPrices } from "@/lib/pricing";

async function SeoPageContent() {
  await requireAdmin();
  const data = await repo.load();
  return (
    <SeoForm
      key={version(data.seo)}
      initial={data.seo}
      prices={getPrices(data)}
      siteUrl={process.env.NEXT_PUBLIC_SITE_URL ?? "https://example.ge"}
    />
  );
}

// Suspense внутри страницы: при переходе между разделами меню остаётся на месте,
// а вместо содержимого сразу видна заглушка, пока проверяется вход и грузятся данные
export default function SeoPage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <SeoPageContent />
    </Suspense>
  );
}
