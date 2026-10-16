import type { Metadata } from "next";
import s from "@/components/admin/admin.module.css";

export const metadata: Metadata = {
  title: "Админка · WoodCraft",
  robots: { index: false, follow: false },
};

export default function AdminRoot({ children }: LayoutProps<"/admin">) {
  return <div className={s.root}>{children}</div>;
}
