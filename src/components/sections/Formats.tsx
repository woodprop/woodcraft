import Link from "next/link";
import { getDict } from "@/i18n";
import { Block } from "@/components/ui/Block";
import { IcBench, IcBoard, IcClock, IcGift, IcPeople } from "@/components/ui/Icons";
import { book } from "@/lib/links";
import s from "./Formats.module.css";

const icons = [[IcBoard, IcClock], [IcBench], [IcGift, IcPeople]];
const hrefs = ["#masterclasses", book.coworking(), "#family"];

export function Formats() {
  const d = getDict().formats;
  return (
    <Block id="formats" tab={d.tab} offset={0} first>
      <div className="in">
        <div className="sh">
          <div>
            <h2 className="h2" id="formats-h">
              {d.title}
            </h2>
          </div>
        </div>
        <div className={s.grid}>
          {d.items.map((it, i) => (
            <article className={`${s.fc} on-dark`} key={it.title}>
              <div className={s.ics} aria-hidden="true">
                {icons[i].map((Ic, k) => (
                  <span className={s.ci} key={k}>
                    <Ic />
                  </span>
                ))}
              </div>
              <div className={s.body}>
                <span className="mono acc">{it.meta}</span>
                <h3 className="h3">{it.title}</h3>
                <hr className="dots" />
                <p className="txt">{it.text}</p>
                <Link className="btn btn-a" href={hrefs[i]} scroll={!hrefs[i].startsWith("?")}>
                  {it.cta}
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </Block>
  );
}
