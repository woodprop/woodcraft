import Link from "next/link";
import { getDict, t } from "@/i18n";
import { Block } from "@/components/ui/Block";
import { Hl } from "@/components/ui/Hl";
import { Shield } from "@/components/ui/Icons";
import { Photo } from "@/components/ui/Photo";
import { book } from "@/lib/links";
import type { Tariff } from "@/lib/types";
import s from "./Coworking.module.css";

export function Coworking({ tariffs }: { tariffs: Tariff[] }) {
  const d = getDict().coworking;
  return (
    <Block id="coworking" tab={d.tab} offset={0.231}>
      <div className="in">
        <div className={s.top}>
          <div className={s.text}>
            <h2 className="h2" id="coworking-h">
              <Hl text={d.title} />
            </h2>
            <p className="lead">{d.lead}</p>
          </div>
          <Photo
            className={s.img}
            img={{ src: "/images/coworking.jpg", alt: d.imgAlt, pos: "50% 45%" }}
            sizes="(max-width: 1000px) 100vw, 600px"
          />
        </div>

        <div className={s.tariffs}>
          {tariffs.map((tr) => (
            <article className={`${s.tar} ${tr.highlight ? `${s.hl} on-dark` : "paper"}`} key={tr.id}>
              <span className={`mono ${tr.highlight ? "acc" : "wd"}`}>{t(d.tariff, { label: tr.label })}</span>
              <p className={s.pr}>
                {tr.price} <small>₾</small>
              </p>
              <hr className="dots" />
              <p className="txt">{tr.desc}</p>
              <Link className={`btn ${tr.highlight ? "btn-a" : "btn-d"}`} href={book.coworking(tr.id)} scroll={false}>
                {d.book}
              </Link>
            </article>
          ))}
        </div>

        <div className={`${s.adm} on-dark`}>
          <div className={s.admL}>
            <span className="mono acc">{d.admTag}</span>
            <h3 className="h3">{d.admTitle}</h3>
            <p className="txt">{d.admText}</p>
            <p className={s.warn}>
              <Shield />
              <span>{d.admWarn}</span>
            </p>
          </div>
          <ol className={s.steps}>
            {d.steps.map(([title, text], i) => (
              <li className={s.st} key={title}>
                <span className={s.n}>{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <p className="h4">{title}</p>
                  <p className="txt">{text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className={s.extra}>
          <p className="mono wd">{d.extraTag}</p>
          <div className={s.exGrid}>
            {d.extra.map(([title, text]) => (
              <div className={s.ex} key={title}>
                <h3 className="h4">{title}</h3>
                <p className="txt">{text}</p>
              </div>
            ))}
          </div>
          <div className="btns">
            <Link className="btn btn-a" href={book.coworking()} scroll={false}>
              {d.cta}
            </Link>
          </div>
        </div>
      </div>
    </Block>
  );
}
