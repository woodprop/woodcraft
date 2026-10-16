import Link from "next/link";
import { getDict } from "@/i18n";
import { Block } from "@/components/ui/Block";
import { Hl } from "@/components/ui/Hl";
import { book } from "@/lib/links";
import type { Content } from "@/lib/types";
import { GalleryGrid } from "./GalleryGrid";
import s from "./Gallery.module.css";

export function Gallery({ gallery }: { gallery: Content["gallery"] }) {
  const d = getDict().gallery;
  return (
    <Block id="gallery" tab={d.tab} offset={0.615}>
      <div className="in">
        <div className="sh">
          <div>
            <h2 className="h2" id="gallery-h">
              <Hl text={d.title} />
            </h2>
            <p className="lead">{d.lead}</p>
          </div>
        </div>
        <GalleryGrid categories={gallery.categories} items={gallery.items} />
        <div className={`btns ${s.cta}`}>
          <Link className="btn btn-d" href={book.masterclass()} scroll={false}>
            {d.cta}
          </Link>
        </div>
      </div>
    </Block>
  );
}
