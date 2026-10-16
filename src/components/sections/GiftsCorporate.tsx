import Link from "next/link";
import { getDict } from "@/i18n";
import { Block } from "@/components/ui/Block";
import { Hl } from "@/components/ui/Hl";
import { Check } from "@/components/ui/Icons";
import { LogoMark } from "@/components/ui/Logo";
import { Photo } from "@/components/ui/Photo";
import { book } from "@/lib/links";
import s from "./GiftsCorporate.module.css";

export function GiftsCorporate() {
  const dict = getDict();
  const g = dict.gifts;
  const c = dict.corporate;
  return (
    <div className={s.row}>
      <Block id="gifts" tab={g.tab} offset={0.9} dark>
        <div className={s.col}>
          <h2 className="h2s" id="gifts-h">
            <Hl text={g.title} />
          </h2>
          <p className="lead">{g.lead}</p>
          <div className={s.cert} role="img" aria-label={g.certAria}>
            <div className={s.certH}>
              <span className={s.brand}>
                <LogoMark size={28} tone="dark" />
                <b>{dict.brand.name}</b>
              </span>
              <span className="mono">{g.certNo}</span>
            </div>
            <div className={s.certB}>
              <span className="mono">{g.certLabel}</span>
              <p className={s.what}>{g.certWhat}</p>
            </div>
            <div className={`${s.certF} mono`}>
              <span>{g.certFor}</span>
              <span>{g.certValid}</span>
            </div>
          </div>
          <ul className="chk">
            {g.points.map((p) => (
              <li key={p}>
                <Check />
                <span>{p}</span>
              </li>
            ))}
          </ul>
          <div className={`btns ${s.cta}`}>
            <Link className="btn btn-a" href={book.certificate()} scroll={false}>
              {g.cta}
            </Link>
          </div>
        </div>
      </Block>

      <Block id="corporate" tab={c.tab} offset={0.2}>
        <div className={s.col}>
          <h2 className="h2s" id="corporate-h">
            <Hl text={c.title} />
          </h2>
          <p className="lead">{c.lead}</p>
          <Photo
            className={s.photo}
            img={{ src: "/images/corporate.jpg", alt: c.imgAlt, pos: "50% 40%" }}
            sizes="(max-width: 1170px) 100vw, 50vw"
          />
          <ul className="chk">
            {c.points.map((p) => (
              <li key={p}>
                <Check />
                <span>{p}</span>
              </li>
            ))}
          </ul>
          <p className="txt">{c.note}</p>
          <div className={`btns ${s.cta}`}>
            <Link className="btn btn-d" href={book.corporate()} scroll={false}>
              {c.cta}
            </Link>
          </div>
        </div>
      </Block>
    </div>
  );
}
