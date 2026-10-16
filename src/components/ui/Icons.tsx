import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { size?: number };

function Svg({ size = 20, children, strokeWidth = 1.8, ...rest }: P) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const Check = (p: P) => (
  <Svg strokeWidth={2} {...p}>
    <path d="M5 12.5l4.5 4.5L19 7" />
  </Svg>
);

export const ArrowLeft = (p: P) => (
  <Svg strokeWidth={2} {...p}>
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </Svg>
);

export const ArrowRight = (p: P) => (
  <Svg strokeWidth={2} {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Svg>
);

export const Close = (p: P) => (
  <Svg strokeWidth={2} {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Svg>
);

export const Burger = (p: P) => (
  <Svg strokeWidth={2} {...p}>
    <path d="M4 9h16M4 15h16" />
  </Svg>
);

export const Plus = (p: P) => (
  <Svg strokeWidth={2} {...p}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);

export const Minus = (p: P) => (
  <Svg strokeWidth={2} {...p}>
    <path d="M5 12h14" />
  </Svg>
);

export const WhatsApp = (p: P) => (
  <Svg {...p}>
    <path d="M20 12a8 8 0 0 1-11.6 7.1L4 20l1-4.2A8 8 0 1 1 20 12z" />
    <path d="M9 9.2c.3 2.6 2.2 4.6 5 5.4" />
  </Svg>
);

export const Telegram = (p: P) => (
  <Svg {...p}>
    <path d="M21 4L3 11.2l6.2 2.3L21 4l-3.2 16-6.6-5.2" />
    <path d="M9.2 13.5V19l2.6-3.4" />
  </Svg>
);

export const Facebook = (p: P) => (
  <Svg {...p}>
    <path d="M14.5 21v-7.5H17l.5-3.2h-3V8.4c0-.9.4-1.6 1.7-1.6h1.5V4a17 17 0 0 0-2.3-.2c-2.4 0-3.9 1.4-3.9 4v2.5H9v3.2h2.5V21" />
  </Svg>
);

export const Instagram = (p: P) => (
  <Svg {...p}>
    <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.2" cy="6.8" r=".6" fill="currentColor" />
  </Svg>
);

export const Shield = (p: P) => (
  <Svg {...p}>
    <path d="M12 3l7 3v5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6z" />
    <path d="M9 12l2 2 4-4" />
  </Svg>
);

export const Info = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8v4M12 16h.01" />
  </Svg>
);

export const Pin = ({ size = 36 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#1C1714" stroke="#E4C590" strokeWidth="1.4" aria-hidden="true">
    <path d="M12 22s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z" />
    <circle cx="12" cy="10" r="2.6" fill="#E4C590" stroke="none" />
  </svg>
);

/* иконки карточек «Форматы» */
export const IcBoard = (p: P) => (
  <Svg size={24} strokeWidth={1.7} {...p}>
    <rect x="3" y="6" width="18" height="12" rx="2" />
    <path d="M3 11c4 0 5.5 2 9 2s5-2 9-2" />
  </Svg>
);

export const IcClock = (p: P) => (
  <Svg size={24} strokeWidth={1.7} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </Svg>
);

export const IcBench = (p: P) => (
  <Svg size={24} strokeWidth={1.7} {...p}>
    <path d="M3 9h18M5 9v11M19 9v11M5 15h14" />
    <path d="M8 4h5v5H8z" />
  </Svg>
);

export const IcGift = (p: P) => (
  <Svg size={24} strokeWidth={1.7} {...p}>
    <rect x="3" y="8" width="18" height="4" rx="1" />
    <rect x="5" y="12" width="14" height="9" rx="1" />
    <path d="M12 8v13M12 8C10 4 7 4 7.5 6.5S12 8 12 8zM12 8c2-4 5-4 4.5-1.5S12 8 12 8z" />
  </Svg>
);

export const IcPeople = (p: P) => (
  <Svg size={24} strokeWidth={1.7} {...p}>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
    <path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.2A6.5 6.5 0 0 1 21.5 20" />
  </Svg>
);
