import { getDict } from "@/i18n";
import { Block } from "@/components/ui/Block";
import { Photo } from "@/components/ui/Photo";
import s from "./Equipment.module.css";

export function Equipment() {
  const d = getDict().equipment;
  return (
    <Block id="equipment" tab={d.tab} offset={0.308} dark>
      <div className="in">
        <div className="sh">
          <div>
            <h2 className="h2" id="equipment-h">
              {d.title}
            </h2>
            <p className="lead">{d.lead}</p>
          </div>
        </div>
        <ul className={s.eq}>
          {d.items.map((it, i) => (
            <li key={it}>
              <span className="mono">{String(i + 1).padStart(2, "0")}</span>
              {it}
            </li>
          ))}
        </ul>
        <div className={`${s.photos} hscroll`}>
          {d.photos.map((p) => (
            <Photo key={p.src} className={s.photo} img={p} sizes="(max-width: 760px) 82vw, 33vw" />
          ))}
        </div>
      </div>
    </Block>
  );
}
