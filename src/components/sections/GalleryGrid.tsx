"use client";

import Image from "next/image";
import { useState, type CSSProperties } from "react";
import { useDict } from "@/components/providers/DictProvider";
import type { GalleryCategory, GalleryItem } from "@/lib/types";
import s from "./Gallery.module.css";

/** сколько работ показывать на телефоне до «Показать ещё» */
const MOBILE_LIMIT = 6;

export function GalleryGrid({ categories, items }: { categories: GalleryCategory[]; items: GalleryItem[] }) {
  const d = useDict().gallery;
  const [cat, setCat] = useState("all");
  const [expanded, setExpanded] = useState(false);
  const shown = items.filter((g) => cat === "all" || g.category === cat);

  return (
    <>
      <div className={s.flt} role="group" aria-label={d.filter}>
        {categories.map((c) => {
          const count = c.id === "all" ? items.length : items.filter((g) => g.category === c.id).length;
          const on = c.id === cat;
          return (
            <button
              key={c.id}
              type="button"
              className={on ? s.on : undefined}
              aria-pressed={on}
              onClick={() => {
                setCat(c.id);
                setExpanded(false);
              }}
            >
              {c.label}
              <span className={s.cnt}>{count}</span>
            </button>
          );
        })}
      </div>
      <div className={`${s.gal} ${expanded ? "" : s.collapsed}`} aria-live="polite">
        {shown.map((g) => (
          <figure className={s.gi} key={g.id}>
            <div className={`ph ${s.img}`} style={{ "--pos": g.image.pos ?? "50% 50%" } as CSSProperties}>
              <Image src={g.image.src} alt={g.image.alt} fill sizes="(max-width: 760px) 50vw, (max-width: 1100px) 33vw, 25vw" />
            </div>
            <figcaption>
              <b>{g.title}</b>
              <span className="mono">{g.sub}</span>
            </figcaption>
          </figure>
        ))}
      </div>
      {!expanded && shown.length > MOBILE_LIMIT && (
        <button type="button" className={`btn btn-o ${s.more}`} onClick={() => setExpanded(true)}>
          {d.more} · {shown.length - MOBILE_LIMIT}
        </button>
      )}
    </>
  );
}
