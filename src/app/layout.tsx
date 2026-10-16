import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Onest, Unbounded } from "next/font/google";
import { DictProvider } from "@/components/providers/DictProvider";
import { defaultLocale, getDict } from "@/i18n";
import "./globals.css";

// next/font скачивает шрифты при сборке и раздаёт их с нашего домена (self-host)
const unbounded = Unbounded({ subsets: ["latin", "cyrillic"], variable: "--font-unbounded", display: "swap" });
const onest = Onest({ subsets: ["latin", "cyrillic"], variable: "--font-onest", display: "swap" });
const jetbrains = JetBrains_Mono({ subsets: ["latin", "cyrillic"], variable: "--font-jetbrains", display: "swap" });

const dict = getDict(defaultLocale);

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: dict.meta.title,
  description: dict.meta.description,
  openGraph: {
    title: dict.meta.title,
    description: dict.meta.description,
    type: "website",
    locale: "ru_RU",
    images: ["/images/hero.jpg"],
  },
};

export const viewport: Viewport = {
  themeColor: "#1C1714",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang={defaultLocale} className={`${unbounded.variable} ${onest.variable} ${jetbrains.variable}`}>
      <body>
        <DictProvider dict={dict}>{children}</DictProvider>
      </body>
    </html>
  );
}
