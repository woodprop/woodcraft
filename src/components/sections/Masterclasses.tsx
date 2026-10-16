import Link from "next/link";
import { getDict } from "@/i18n";
import { Block } from "@/components/ui/Block";
import { Hl } from "@/components/ui/Hl";
import { Check } from "@/components/ui/Icons";
import { book } from "@/lib/links";
import type { Masterclass } from "@/lib/types";
import { McCarousel } from "./McCarousel";
import s from "./Masterclasses.module.css";

export function Masterclasses({ items }: { items: Masterclass[] }) {
  const d = getDict().mc;
  return (
    <Block id="masterclasses" tab={d.tab} offset={0.077}>
      <div className="in">
        <div className="sh">
          <div>
            <h2 className="h2" id="masterclasses-h">
              <Hl text={d.title} />
            </h2>
            <p className="lead">{d.lead}</p>
          </div>
        </div>

        <McCarousel items={items} />

        <div className={`${s.incl} paper`}>
          <div className={s.inclL}>
            <span className="mono wd">{d.inclTag}</span>
            <h3 className="h3">{d.inclTitle}</h3>
            <p className="txt">{d.inclText}</p>
            <Link className="btn btn-d" href={book.masterclass()} scroll={false}>
              {d.inclCta}
            </Link>
          </div>
          <ul className={`chk ${s.inclList}`}>
            {d.incl.map(([b, rest]) => (
              <li key={b}>
                <Check />
                <span>
                  <b>{b}</b>
                  {rest}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Block>
  );
}
