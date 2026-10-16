import Link from "next/link";
import { getDict } from "@/i18n";
import { Header } from "@/components/layout/Header";
import { Hl } from "@/components/ui/Hl";
import { Check } from "@/components/ui/Icons";
import { Photo } from "@/components/ui/Photo";
import { book } from "@/lib/links";
import { fillPrices } from "@/lib/pricing";
import type { Contacts, Prices } from "@/lib/types";
import s from "./Hero.module.css";

export function Hero({ contacts, prices }: { contacts: Contacts; prices: Prices }) {
  const d = getDict().hero;
  return (
    <div className={s.wrap}>
      <Header contacts={contacts} />
      <section className={s.hero} id="top" aria-labelledby="top-h">
        <div className="in">
          <div className={`pills mono ${s.pills}`}>
            {d.pills.map((p) => (
              <span className="pill" key={p}>
                {p}
              </span>
            ))}
          </div>
          <h1 className="h1" id="top-h">
            <Hl text={d.title} />
          </h1>
          <div className={s.grid}>
            <div className={s.left}>
              <div className={s.offers}>
                {d.offers.map((o) => (
                  <p className="lead" key={o.b}>
                    <b>{fillPrices(o.b, prices)}</b>
                    {o.t}
                  </p>
                ))}
              </div>
              <div className={s.actions}>
                <div className={s.btns}>
                  <Link className="btn btn-d" href={book.masterclass()} scroll={false}>
                    {d.ctaMc}
                  </Link>
                  <Link className="btn btn-o" href={book.coworking()} scroll={false}>
                    {d.ctaCw}
                  </Link>
                </div>
                <p className={s.note}>
                  <Check size={20} />
                  {d.note}
                </p>
              </div>
            </div>
            <Photo
              className={s.photo}
              img={{ src: "/images/hero.jpg", alt: d.imgAlt, pos: "50% 92%", posMobile: "50% 80%" }}
              sizes="(max-width: 860px) 100vw, 60vw"
              priority
            />
          </div>
        </div>
      </section>
    </div>
  );
}
