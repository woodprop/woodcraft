"use client";

import Link from "next/link";
import { useState } from "react";
import { useDict } from "@/components/providers/DictProvider";
import { Dialog } from "@/components/ui/Dialog";
import { Burger, Close, Facebook, Telegram, WhatsApp } from "@/components/ui/Icons";
import { LogoMark } from "@/components/ui/Logo";
import { book, social } from "@/lib/links";
import type { Contacts } from "@/lib/types";
import s from "./Header.module.css";

export function Header({ contacts }: { contacts: Contacts }) {
  const d = useDict();
  const [menu, setMenu] = useState(false);

  // переход по якорю из меню: сначала закрываем панель, затем прокручиваем
  const go = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setMenu(false);
    window.setTimeout(() => {
      document.querySelector(href)?.scrollIntoView({ behavior: "smooth", block: "start" });
      history.replaceState(null, "", href);
    }, 220);
  };

  return (
    <header className={s.top}>
      <a className={s.logo} href="#top" aria-label={d.nav.home}>
        <LogoMark size={40} />
        <span className={s.wm}>{d.brand.name}</span>
      </a>

      <nav className={s.navtabs} aria-label={d.nav.label}>
        {d.nav.main.map((n) => (
          <a key={n.href} className={s.ntab} href={n.href}>
            {n.label}
          </a>
        ))}
      </nav>

      <div className={s.topr}>
        <a className={`icb ${s.soc}`} href={social(contacts.whatsapp)} aria-label="WhatsApp">
          <WhatsApp />
        </a>
        <a className={`icb ${s.soc}`} href={social(contacts.telegram)} aria-label="Telegram">
          <Telegram />
        </a>
        <Link className={`btn btn-a ${s.cta}`} href={book.masterclass()} scroll={false}>
          {d.nav.book}
        </Link>
        <button
          className={s.burger}
          type="button"
          aria-label={d.nav.openMenu}
          aria-haspopup="dialog"
          aria-expanded={menu}
          onClick={() => setMenu(true)}
        >
          <Burger size={22} />
        </button>
      </div>

      <Dialog open={menu} onClose={() => setMenu(false)} variant="menu" label={d.nav.label}>
        <div className={s.mm}>
          <div className={s.mmTop}>
            <a className={s.logo} href="#top" onClick={(e) => go(e, "#top")} aria-label={d.nav.home}>
              <LogoMark size={34} />
              <span className={s.wm}>{d.brand.name}</span>
            </a>
            <button className={s.burger} type="button" aria-label={d.nav.closeMenu} onClick={() => setMenu(false)}>
              <Close size={22} />
            </button>
          </div>
          <nav className={s.mmNav} aria-label={d.nav.label}>
            {d.nav.full.map((n, i) => (
              <a key={n.href} href={n.href} onClick={(e) => go(e, n.href)}>
                <span className="mono">{String(i + 1).padStart(2, "0")}</span>
                {n.label}
              </a>
            ))}
          </nav>
          <div className={s.mmBot}>
            <div className={s.mmSoc}>
              <a className="icb" href={social(contacts.whatsapp)} aria-label="WhatsApp">
                <WhatsApp />
              </a>
              <a className="icb" href={social(contacts.telegram)} aria-label="Telegram">
                <Telegram />
              </a>
              <a className="icb" href={social(contacts.facebook)} aria-label="Facebook">
                <Facebook />
              </a>
            </div>
            <Link className="btn btn-a" href={book.masterclass()} scroll={false} onClick={() => setMenu(false)}>
              {d.nav.book}
            </Link>
          </div>
        </div>
      </Dialog>
    </header>
  );
}
