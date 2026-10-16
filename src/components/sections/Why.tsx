import { getDict } from "@/i18n";
import { Block } from "@/components/ui/Block";
import { Hl } from "@/components/ui/Hl";
import s from "./Why.module.css";

export function Why() {
  const d = getDict().why;
  return (
    <Block id="why" tab={d.tab} offset={0.154} dark>
      <div className="in">
        <div className="sh">
          <div>
            <h2 className="h2" id="why-h">
              <Hl text={d.title} />
            </h2>
            <p className="lead">{d.lead}</p>
          </div>
        </div>
        <div className={`${s.grid} hscroll`}>
          {d.items.map(([title, text], i) => (
            <article className={s.wy} key={title}>
              <span className="mono acc">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="h4">{title}</h3>
              <hr className="dots" />
              <p className="txt">{text}</p>
            </article>
          ))}
        </div>
      </div>
    </Block>
  );
}
