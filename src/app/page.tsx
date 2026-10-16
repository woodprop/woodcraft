import type { Metadata } from "next";
import { Suspense } from "react";
import { Footer } from "@/components/layout/Footer";
import { ModalHost } from "@/components/modals/ModalHost";
import { BookingProvider } from "@/components/providers/BookingProvider";
import { Coworking } from "@/components/sections/Coworking";
import { Equipment } from "@/components/sections/Equipment";
import { Family } from "@/components/sections/Family";
import { Faq } from "@/components/sections/Faq";
import { Formats } from "@/components/sections/Formats";
import { Gallery } from "@/components/sections/Gallery";
import { GiftsCorporate } from "@/components/sections/GiftsCorporate";
import { Hero } from "@/components/sections/Hero";
import { How } from "@/components/sections/How";
import { Masterclasses } from "@/components/sections/Masterclasses";
import { Masters } from "@/components/sections/Masters";
import { Request } from "@/components/sections/Request";
import { Reviews } from "@/components/sections/Reviews";
import { Why } from "@/components/sections/Why";
import { getContent } from "@/lib/content";

export async function generateMetadata(): Promise<Metadata> {
  const { seo } = await getContent("ru");
  return {
    title: seo.title,
    description: seo.description,
    // openGraph из layout заменяется целиком, поэтому повторяем общие поля
    openGraph: { title: seo.title, description: seo.description, type: "website", locale: "ru_RU", images: ["/images/hero.jpg"] },
  };
}

export default async function Home() {
  const c = await getContent("ru");
  return (
    <BookingProvider>
      <main className="page">
        <Hero contacts={c.contacts} prices={c.prices} />
        <Formats prices={c.prices} />
        <Masterclasses items={c.masterclasses} />
        <Why />
        <Coworking tariffs={c.tariffs} />
        <Equipment />
        <Family prices={c.prices} />
        <GiftsCorporate />
        <Gallery gallery={c.gallery} />
        <Reviews items={c.reviews} />
        <Masters items={c.masters} />
        <How />
        <Faq items={c.faq} contacts={c.contacts} />
        <Request contacts={c.contacts} />
        <Footer contacts={c.contacts} schedule={c.coworking} />
      </main>
      <Suspense fallback={null}>
        <ModalHost data={{ masterclasses: c.masterclasses, tariffs: c.tariffs, booking: c.booking, contacts: c.contacts, coworking: c.coworking, prices: c.prices }} />
      </Suspense>
    </BookingProvider>
  );
}
