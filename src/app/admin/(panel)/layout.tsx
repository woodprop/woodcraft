import { Suspense } from "react";
import { Nav } from "@/components/admin/Nav";
import { PageLoading } from "@/components/admin/PageLoading";
import { ToastProvider } from "@/components/admin/Toast";
import { requireAdmin } from "@/lib/admin/auth";
import s from "@/components/admin/admin.module.css";

/** Проверяем вход до того, как показать меню */
async function Guard({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return children;
}

// Каждая страница сама оборачивает содержимое в <Suspense>: при переходе между
// разделами этот layout уже на экране, и его границы для новой страницы не срабатывают.
export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <Suspense
        fallback={
          <main className={s.main}>
            <PageLoading />
          </main>
        }
      >
        <Guard>
          <div className={s.shell}>
            <Nav />
            <main className={s.main}>{children}</main>
          </div>
        </Guard>
      </Suspense>
    </ToastProvider>
  );
}
