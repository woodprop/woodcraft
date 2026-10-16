"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { useDict } from "@/components/providers/DictProvider";
import { ArrowLeft, ArrowRight } from "@/components/ui/Icons";
import { t } from "@/i18n";
import { formatDateTime } from "@/lib/format";
import { book } from "@/lib/links";
import type { Masterclass } from "@/lib/types";
import s from "./Masterclasses.module.css";

const COPIES = 3;
/** с какой карточки стартуем: как в макете — третья по центру, все пять видны по порядку */
const START = 2;

/**
 * Бесконечная карусель на нативном scroll-snap.
 * Рендерим 3 копии списка; после остановки прокрутки незаметно
 * возвращаемся в среднюю копию. На тач-устройствах работает обычный свайп.
 */
export function McCarousel({ items }: { items: Masterclass[] }) {
  const d = useDict().mc;
  const n = items.length;
  const scroller = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(START);

  const metrics = useCallback(() => {
    const el = scroller.current!;
    const cards = el.querySelectorAll<HTMLElement>("[data-card]");
    const step = cards.length > 1 ? cards[1].offsetLeft - cards[0].offsetLeft : el.clientWidth;
    return { el, cards, step };
  }, []);

  /** индекс карточки, ближайшей к центру */
  const nearest = useCallback(() => {
    const { el, cards } = metrics();
    const center = el.scrollLeft + el.clientWidth / 2;
    let best = 0;
    let dist = Infinity;
    cards.forEach((c, i) => {
      const dd = Math.abs(c.offsetLeft + c.offsetWidth / 2 - center);
      if (dd < dist) {
        dist = dd;
        best = i;
      }
    });
    return best;
  }, [metrics]);

  const centerOn = useCallback(
    (i: number, smooth: boolean) => {
      const { el, cards } = metrics();
      const c = cards[i];
      if (!c) return;
      el.scrollTo({ left: c.offsetLeft + c.offsetWidth / 2 - el.clientWidth / 2, behavior: smooth ? "smooth" : "instant" });
    },
    [metrics],
  );

  // стартовая позиция — средняя копия
  useLayoutEffect(() => {
    centerOn(n + START, false);
    const onResize = () => centerOn(n + (nearest() % n), false);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [centerOn, nearest, n]);

  // активная точка + «телепорт» в среднюю копию после остановки
  useEffect(() => {
    const el = scroller.current!;
    let raf = 0;
    let idle = 0;
    const settle = () => {
      const i = nearest();
      if (i < n || i >= 2 * n) {
        const target = n + (i % n);
        const { step } = metrics();
        el.style.scrollSnapType = "none";
        el.scrollLeft += (target - i) * step;
        requestAnimationFrame(() => (el.style.scrollSnapType = ""));
      }
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setActive(nearest() % n));
      window.clearTimeout(idle);
      idle = window.setTimeout(settle, 140);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
      window.clearTimeout(idle);
    };
  }, [metrics, nearest, n]);

  const move = (dir: 1 | -1) => centerOn(nearest() + dir, true);
  const goTo = (k: number) => {
    const cur = nearest();
    const base = cur - (cur % n);
    centerOn(base + k, true);
  };

  const all = Array.from({ length: COPIES * n }, (_, k) => ({ item: items[k % n], k, real: k >= n && k < 2 * n }));

  return (
    <div className={s.carw}>
      <div className={s.car} ref={scroller} role="region" aria-roledescription="carousel" aria-label={d.tab}>
        <div className={s.track}>
          {all.map(({ item, k, real }) => {
            const next = item.sessions[0];
            const date = next ? formatDateTime(next.start) : "";
            const left = next?.seatsLeft ?? 0;
            return (
              <Link
                key={k}
                data-card=""
                className={s.mcc}
                href={book.masterclass(item.id)}
                scroll={false}
                aria-label={t(d.cardAria, { title: item.title, date })}
                aria-hidden={real ? undefined : true}
                tabIndex={real ? undefined : -1}
                inert={!real}
              >
                <div className={`ph ${s.img}`} style={{ "--pos": item.image.pos ?? "50% 50%" } as CSSProperties}>
                  <Image src={item.image.src} alt="" fill sizes="300px" />
                </div>
                <div className={s.body}>
                  <div className={`${s.top} mono`}>
                    <b>{item.num}</b>
                    <span>{date}</span>
                  </div>
                  <h3 className={s.title}>{item.title}</h3>
                  <p className="txt">{item.desc}</p>
                  <div className={s.meta}>
                    <span className="mono">{item.duration}</span>
                    <span className={s.price}>{item.price} ₾</span>
                  </div>
                  <div className={s.seats}>
                    <span className={s.boxes} aria-hidden="true">
                      {Array.from({ length: item.capacity }, (_, i) => (
                        <i key={i} className={i < item.capacity - left ? "" : s.free} />
                      ))}
                    </span>
                    <span className="mono">{t(d.seatsLeft, { n: left, max: item.capacity })}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
      <div className={s.cnav}>
        <button className="icb nav-b" type="button" aria-label={d.prev} onClick={() => move(-1)}>
          <ArrowLeft />
        </button>
        <div className="cdots" role="group" aria-label={d.dots}>
          {items.map((it, k) => (
            <button
              key={it.id}
              type="button"
              className={`cdot${k === active ? " on" : ""}`}
              aria-label={t(d.dot, { n: it.num })}
              aria-current={k === active ? "true" : undefined}
              onClick={() => goTo(k)}
            />
          ))}
        </div>
        <button className="icb nav-b" type="button" aria-label={d.next} onClick={() => move(1)}>
          <ArrowRight />
        </button>
      </div>
    </div>
  );
}
