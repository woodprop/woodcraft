import { getDict } from "@/i18n";
import { Block } from "@/components/ui/Block";
import { Hl } from "@/components/ui/Hl";
import { Photo } from "@/components/ui/Photo";
import type { Master } from "@/lib/types";
import s from "./Masters.module.css";

export function Masters({ items }: { items: Master[] }) {
  const d = getDict().masters;
  return (
    <Block id="masters" tab={d.tab} offset={0.769}>
      <div className="in">
        <div className="sh">
          <div>
            <h2 className="h2" id="masters-h">
              <Hl text={d.title} />
            </h2>
            <p className="lead">{d.lead}</p>
          </div>
        </div>
        <div className={s.ms}>
          {items.map((m) => (
            <article className={s.m} key={m.id}>
              <Photo className={s.img} img={m.image} sizes="(max-width: 760px) 100vw, (max-width: 1000px) 40vw, 400px" />
              <div className={s.body}>
                <span className="mono wd">{m.meta}</span>
                <h3 className="h3">{m.name}</h3>
                <p className="txt">{m.bio}</p>
                <hr className="dots" />
                <q className={s.q}>{m.quote}</q>
              </div>
            </article>
          ))}
        </div>
      </div>
    </Block>
  );
}
