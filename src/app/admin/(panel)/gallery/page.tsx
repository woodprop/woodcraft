import { Suspense } from "react";
import { PageLoading } from "@/components/admin/PageLoading";
import { GalleryEditor } from "@/components/admin/GalleryEditor";
import { repo } from "@/lib/admin";
import { requireAdmin } from "@/lib/admin/auth";
import { version } from "@/lib/admin/drafts";
import { imageLibrary } from "@/lib/admin/images";

async function GalleryPageContent() {
  await requireAdmin();
  const data = await repo.load();
  return <GalleryEditor key={version(data.gallery)} initial={data.gallery} library={await imageLibrary(data)} />;
}

// Suspense внутри страницы: при переходе между разделами меню остаётся на месте,
// а вместо содержимого сразу видна заглушка, пока проверяется вход и грузятся данные
export default function GalleryPage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <GalleryPageContent />
    </Suspense>
  );
}
