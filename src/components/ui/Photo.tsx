import Image from "next/image";
import type { CSSProperties } from "react";
import type { Img } from "@/lib/types";

type Props = {
  img: Img;
  sizes: string;
  className?: string;
  priority?: boolean;
  style?: CSSProperties;
};

/**
 * Фото в контейнере .ph (размер задаёт контейнер, картинка — object-fit: cover).
 * Кадрирование: --pos на десктопе, --pos-m на мобильном (≤760px).
 */
export function Photo({ img, sizes, className, priority, style }: Props) {
  const vars = {
    "--pos": img.pos ?? "50% 50%",
    "--pos-m": img.posMobile ?? img.pos ?? "50% 50%",
    ...style,
  } as CSSProperties;
  return (
    <div className={["ph", className].filter(Boolean).join(" ")} style={vars}>
      <Image src={img.src} alt={img.alt} fill sizes={sizes} priority={priority} />
    </div>
  );
}
