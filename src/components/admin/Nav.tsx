"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/admin/actions";
import { LogoMark } from "@/components/ui/Logo";
import { ICalendar, IChat, IClock, IExternal, IHome, IImage, ILogout, ISearch, ITag } from "./icons";
import s from "./admin.module.css";

const links = [
  { href: "/admin", label: "Главная", Icon: IHome },
  { href: "/admin/events", label: "Мастер-классы", Icon: ICalendar },
  { href: "/admin/prices", label: "Цены", Icon: ITag },
  { href: "/admin/coworking", label: "Коворкинг", Icon: IClock },
  { href: "/admin/gallery", label: "Галерея", Icon: IImage },
  { href: "/admin/reviews", label: "Отзывы", Icon: IChat },
  { href: "/admin/seo", label: "SEO", Icon: ISearch },
];

export function Nav() {
  const path = usePathname();
  const active = (href: string) => (href === "/admin" ? path === href : path.startsWith(href));
  return (
    <aside className={s.side}>
      <Link href="/admin" className={s.brand}>
        <LogoMark size={36} />
        <div>
          <b>WOODCRAFT</b>
          <span>Админка</span>
        </div>
      </Link>
      <nav className={s.nav} aria-label="Разделы админки">
        {links.map(({ href, label, Icon }) => (
          <Link key={href} href={href} className={s.navLink} aria-current={active(href) ? "page" : undefined}>
            <Icon />
            {label}
          </Link>
        ))}
      </nav>
      <div className={s.sideFoot}>
        <a href="/" target="_blank" rel="noopener" className={s.navLink}>
          <IExternal />
          Открыть сайт
        </a>
        <form action={logout}>
          <button type="submit" className={s.navLink}>
            <ILogout />
            Выйти
          </button>
        </form>
      </div>
    </aside>
  );
}
