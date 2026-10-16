import Link from "next/link";
import { getDict } from "@/i18n";
import { Block } from "@/components/ui/Block";
import { Hl } from "@/components/ui/Hl";
import { Photo } from "@/components/ui/Photo";
import { book } from "@/lib/links";
import s from "./Family.module.css";

export function Family() {
  const d = getDict().family;
  return (
    <Block id="family" tab={d.tab} offset={0.385}>
      <div className={`in ${s.fam}`}>
        <Photo
          className={s.photo}
          img={{ src: "/images/family.jpg", alt: d.imgAlt, pos: "48% 50%", posMobile: "46% 55%" }}
          sizes="(max-width: 1000px) 100vw, 600px"
        />
        <div className={s.right}>
          <span className="mono wd">{d.tag}</span>
          <h2 className="h2" id="family-h">
            <Hl text={d.title} />
          </h2>
          <p className="lead">{d.lead}</p>
          <dl className={s.facts}>
            {d.facts.map(([k, v]) => (
              <div key={k}>
                <dt className="mono">{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
            <div>
              <dt className="mono">{d.priceLabel}</dt>
              <dd>
                <b>{d.price}</b>
                {d.priceNote}
              </dd>
            </div>
          </dl>
          <p className={s.quote}>{d.quote}</p>
          <div className={`btns ${s.btns}`}>
            <Link className="btn btn-d" href={book.family()} scroll={false}>
              {d.cta}
            </Link>
          </div>
        </div>
      </div>
    </Block>
  );
}
