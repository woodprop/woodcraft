import { useId } from "react";

type Props = {
  size?: number;
  /** "light" — светлый знак (для тёмного фона), "dark" — тёмный знак */
  tone?: "light" | "dark";
};

/** Знак WoodCraft: годовые кольца в квадрате со скруглением + срез стамески */
export function LogoMark({ size = 40, tone = "light" }: Props) {
  const id = useId();
  const bg = tone === "light" ? "#E4C590" : "#1C1714";
  const fg = tone === "light" ? "#1C1714" : "#E4C590";
  const sw = size <= 28 ? 2 : 1.7;
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" focusable="false">
      <defs>
        <clipPath id={id}>
          <rect width="40" height="40" rx="5" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id})`}>
        <rect width="40" height="40" fill={bg} />
        <g fill="none" stroke={fg} strokeWidth={sw}>
          <path d="M0 34 A6 6 0 0 1 6 40" />
          <path d="M0 27 A13 13 0 0 1 13 40" />
          <path d="M0 19.5 A20.5 20.5 0 0 1 20.5 40" />
          <path d="M0 11.5 A28.5 28.5 0 0 1 28.5 40" />
          <path d="M0 3 A37 37 0 0 1 37 40" />
          {size > 28 && <path d="M0 -6 A46 46 0 0 1 46 40" />}
        </g>
        <path d="M40 0 L26.5 13.5" stroke={fg} strokeWidth={sw} strokeLinecap="round" />
      </g>
    </svg>
  );
}
