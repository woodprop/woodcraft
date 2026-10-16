// Типы контента. Повторяют структуру будущих таблиц БД.
// «Хранимые» типы (…Rec, SiteData) — то, что редактирует админка;
// «публичные» (Masterclass, Review, Content) — то, что получает сайт после подготовки в getContent().

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
  /** дата и время начала, например "2026-10-24T12:00" */
  start: string;
  /** время окончания "14:00" */
  end: string;
  seatsLeft: number;
};

export type Option = { id: string; label: string; hint?: string; price?: number };

/* ---------- Хранимые данные (редактируются в /admin) ---------- */

export type MasterclassRec = {
  id: string;
  title: string;
  desc: string;
  /** подробное описание для модалки */
  about: string;
  /** длительность в часах, шаг 0,5 */
  hours: number;
  price: number;
  capacity: number;
  image: Img;
  sessions: Session[];
  /** скрыт с сайта */
  hidden?: boolean;
};

export type Tariff = {
  id: string;
  label: string;
  price: number;
  desc: string;
  highlight?: boolean;
  /** тариф на весь день — время начала не выбирается */
  fullDay?: boolean;
};

export type Family = {
  /** цена за пару «взрослый + ребёнок» */
  price: number;
  products: Option[];
  sessions: Session[];
};

export type WorkDay = { open: boolean; from: string; to: string };

export type CoworkingSchedule = {
  /** 7 дней, начиная с понедельника */
  week: WorkDay[];
  /** время начала, которое можно выбрать при бронировании */
  slotTimes: string[];
  /** на сколько дней вперёд открыта запись */
  daysAhead: number;
  closedDates: { date: string; reason: string }[];
};

export type GalleryCategory = { id: string; label: string };

export type GalleryItem = {
  id: string;
  category: string;
  title: string;
  sub: string;
  image: Img;
  hidden?: boolean;
};

export type ReviewRec = {
  id: string;
  name: string;
  format: string;
  text: string;
  made: string;
  hidden?: boolean;
};

export type Seo = {
  /** можно использовать {mcFrom}, {cwFrom}, {familyFrom} — подставятся текущие цены */
  title: string;
  description: string;
};

/** Всё, что редактирует админка. Порядок элементов в массивах = порядок на сайте. */
export type SiteData = {
  masterclasses: MasterclassRec[];
  tariffs: Tariff[];
  family: Family;
  certificateSums: Option[];
  coworking: CoworkingSchedule;
  gallery: { categories: GalleryCategory[]; items: GalleryItem[] };
  reviews: ReviewRec[];
  seo: Seo;
};

/* ---------- Публичные данные (то, что видит сайт) ---------- */

export type Masterclass = Omit<MasterclassRec, "hours" | "hidden"> & {
  /** порядковый номер на сайте: "01" */
  num: string;
  duration: string;
  durationShort: string;
};

export type Review = Omit<ReviewRec, "hidden"> & { initial: string };

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
};

/** Цены «от …» для текстов сайта — считаются из данных */
export type Prices = {
  mcFrom: number;
  cwFrom: number;
  familyFrom: number;
  /** «2–4 часа» */
  mcHours: string;
};

export type Content = {
  contacts: Contacts;
  masterclasses: Masterclass[];
  tariffs: Tariff[];
  gallery: { categories: GalleryCategory[]; items: GalleryItem[] };
  reviews: Review[];
  masters: Master[];
  faq: Faq[];
  coworking: CoworkingSchedule;
  prices: Prices;
  seo: Seo;
  booking: {
    familyProducts: Option[];
    familySessions: Session[];
    familyPrice: number;
    corporateSizes: Option[];
    corporateProducts: Option[];
    certificateSums: Option[];
    certificateFormats: Option[];
  };
};
