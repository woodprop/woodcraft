import Image from "next/image";
import { getDict } from "@/i18n";
import { Facebook, Instagram, Pin, Telegram } from "@/components/ui/Icons";
import { LogoMark } from "@/components/ui/Logo";
import { social } from "@/lib/links";
import { hoursLines } from "@/lib/schedule";
import type { Contacts, CoworkingSchedule } from "@/lib/types";
import s from "./Footer.module.css";

/** Плашка-заглушка для данных, которые ещё не заданы в settings.json */
function Val({ v }: { v: string }) {
  return v.startsWith("[") ? <span className="todo">{v}</span> : <>{v}</>;
}

export function Footer({ contacts, schedule }: { contacts: Contacts; schedule: CoworkingSchedule }) {
  const dict = getDict();
  const d = dict.footer;
  const mapInner = (
    <>
      <span className={s.mapLabel}>Карта · Google Maps</span>
      <span className={s.pin}>
        <Pin />
      </span>
    </>
  );
  return (
    <footer className={s.ft}>
      <div className={s.inner}>
        <div className="in">
          <div className={s.grid}>
            <div className={s.brand}>
              <a href="#top" className={s.logo} aria-label={d.toTop}>
                <LogoMark size={44} tone="dark" />
                <span className={s.logoText}>
                  <b>{dict.brand.name}</b>
                  <span className="mono">{dict.brand.tagline}</span>
                </span>
              </a>
              <p className="txt">{d.about}</p>
              <div className={s.soc}>
                <a className="icb" href={social(contacts.instagram)} aria-label="Instagram">
                  <Instagram />
                </a>
                <a className="icb" href={social(contacts.facebook)} aria-label="Facebook">
                  <Facebook />
                </a>
                <a className="icb" href={social(contacts.telegram)} aria-label="Telegram">
                  <Telegram />
                </a>
              </div>
            </div>

            <nav className={s.col} aria-label={d.sections}>
              <span className="mono">{d.sections}</span>
              {dict.nav.full.slice(0, 5).map((n) => (
                <a key={n.href} href={n.href}>
                  {n.label}
                </a>
              ))}
            </nav>

            <div className={s.col}>
              <span className="mono">{d.contacts}</span>
              <p>
                {contacts.city}, <Val v={contacts.address} />
              </p>
              <a href={contacts.phoneHref ? `tel:${contacts.phoneHref}` : "#contacts"}>
                <Val v={contacts.phone} />
              </a>
              <a href={social(contacts.whatsapp)}>WhatsApp</a>
              <a href={social(contacts.telegram)}>Telegram</a>
              <a href={social(contacts.facebook)}>Facebook</a>
            </div>

            <div className={s.col}>
              <span className="mono">{d.hours}</span>
              {hoursLines(schedule.week).map(([days, time]) => (
                <p key={days}>{`${days} ${time}`}</p>
              ))}
            </div>

            {contacts.mapUrl ? (
              <a className={`ph ${s.map}`} href={contacts.mapUrl} target="_blank" rel="noopener noreferrer" aria-label={d.map}>
                {mapInner}
              </a>
            ) : (
              <div className={`ph ${s.map}`} aria-hidden="true">
                {mapInner}
              </div>
            )}
          </div>
          <div className={s.bot}>
            <span>{d.copyright}</span>
            <span>{d.privacy}</span>
          </div>
        </div>
      </div>
      <div className={s.giant} aria-hidden="true">
        <Image className={s.giantImg} src="/images/footer.jpg" alt="" fill sizes="100vw" />
        <svg viewBox="0 0 1000 124" preserveAspectRatio="xMidYMax meet">
          <text x="0" y="112" textLength="1000" lengthAdjust="spacingAndGlyphs">
            {dict.brand.name}
          </text>
        </svg>
      </div>
    </footer>
  );
}
