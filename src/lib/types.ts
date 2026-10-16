// Типы контента. Повторяют структуру будущих таблиц БД / коллекций CMS.

export type Locale = "ru";

export type Img = {
  src: string;
  alt: string;
  /** object-position для десктопа, например "50% 40%" */
  pos?: string;
  /** отдельное кадрирование для мобильных, если нужно */
  posMobile?: string;
};

export type Session = {
  /** ISO-дата и время начала, например "2026-10-24T12:00" */
  start: string;
  /** время окончания "14:00" */
  end: string;
  seatsLeft: number;
};

export type Masterclass = {
  id: string;
  num: string;
  title: string;
  desc: string;
  /** подробное описание для модалки */
  about: string;
  duration: string;
  durationShort: string;
  price: number;
  capacity: number;
  image: Img;
  sessions: Session[];
};

export type Tariff = {
  id: string;
  label: string;
  price: number;
  desc: string;
  highlight?: boolean;
};

export type GalleryCategory = { id: string; label: string };

export type GalleryItem = {
  id: string;
  category: string;
  title: string;
  sub: string;
  image: Img;
};

export type Review = {
  id: string;
  name: string;
  initial: string;
  format: string;
  text: string;
  made: string;
};

export type Master = {
  id: string;
  name: string;
  meta: string;
  bio: string;
  quote: string;
  image: Img;
};

export type Faq = {
  q: string;
  a: string;
  /** пометка «нужно уточнить» — выводится плашкой */
  todo?: string;
};

export type Option = { id: string; label: string; hint?: string; price?: number };

export type Contacts = {
  city: string;
  address: string;
  phone: string;
  phoneHref: string;
  whatsapp: string;
  telegram: string;
  facebook: string;
  instagram: string;
  mapUrl: string;
  hours: { weekdays: string; weekends: string };
};

export type Content = {
  contacts: Contacts;
  masterclasses: Masterclass[];
  tariffs: Tariff[];
  gallery: { categories: GalleryCategory[]; items: GalleryItem[] };
  reviews: Review[];
  masters: Master[];
  faq: Faq[];
  booking: {
    coworkingTimes: string[];
    coworkingDays: number;
    familyProducts: Option[];
    familySessions: Session[];
    familyPrice: number;
    corporateSizes: Option[];
    corporateProducts: Option[];
    certificateSums: Option[];
    certificateFormats: Option[];
  };
};
