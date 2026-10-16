import { getDict } from "@/i18n";
import { Block } from "@/components/ui/Block";
import { Hl } from "@/components/ui/Hl";
import type { Review } from "@/lib/types";
import s from "./Reviews.module.css";

export function Reviews({ items }: { items: Review[] }) {
  const d = getDict().reviews;
  return (
    <Block id="reviews" tab={d.tab} offset={0.692} dark>
      <div className="in">
        <div className="sh">
          <div>
            <h2 className="h2" id="reviews-h">
              <Hl text={d.title} />
            </h2>
          </div>
        </div>
        <div className={`${s.rvs} hscroll`}>
          {items.map((r) => (
            <article className={s.rv} key={r.id}>
              <div className={s.head}>
                <span className={s.av} aria-hidden="true">
                  {r.initial}
                </span>
                <div>
                  <p className="h4">{r.name}</p>
                  <p className="mono acc">{r.format}</p>
                </div>
              </div>
              <blockquote>{r.text}</blockquote>
              <p className={`${s.tag} mono`}>{r.made}</p>
            </article>
          ))}
        </div>
      </div>
    </Block>
  );
}
