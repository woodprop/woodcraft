import { getDict } from "@/i18n";
import { Block } from "@/components/ui/Block";
import { Hl } from "@/components/ui/Hl";
import s from "./How.module.css";

export function How() {
  const d = getDict().how;
  return (
    <Block id="how" tab={d.tab} offset={0.846} dark>
      <div className="in">
        <div className="sh">
          <div>
            <h2 className="h2" id="how-h">
              <Hl text={d.title} />
            </h2>
          </div>
        </div>
        <ol className={s.how}>
          {d.steps.map(([title, text], i) => (
            <li className={s.hs} key={title}>
              <span className={s.n}>{String(i + 1).padStart(2, "0")}</span>
              <div className={s.body}>
                <h3 className="h4">{title}</h3>
                <p className="txt">{text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </Block>
  );
}
