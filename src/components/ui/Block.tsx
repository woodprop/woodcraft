import type { CSSProperties, ReactNode } from "react";

type Props = {
  id: string;
  tab: string;
  /** смещение вкладки по горизонтали, 0…1 (лесенка на десктопе) */
  offset: number;
  dark?: boolean;
  first?: boolean;
  className?: string;
  cardClassName?: string;
  children: ReactNode;
};

/** Секция страницы: вкладка-ярлык сверху + карточка */
export function Block({ id, tab, offset, dark, first, className, cardClassName, children }: Props) {
  const cls = ["blk", dark && "dk", first && "first", className].filter(Boolean).join(" ");
  return (
    <section className={cls} id={id} style={{ "--o": offset } as CSSProperties} aria-labelledby={`${id}-h`}>
      <div className="stab mono" aria-hidden="true">
        <span>{tab}</span>
      </div>
      <div className={["card", cardClassName].filter(Boolean).join(" ")}>{children}</div>
    </section>
  );
}
