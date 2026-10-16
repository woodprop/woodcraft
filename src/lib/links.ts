// Ссылки на модальные окна. У каждой модалки свой URL (?book=…),
// поэтому ссылку на запись можно отправить в мессенджер.

export type ModalKind = "masterclass" | "coworking" | "certificate" | "corporate" | "family" | "success";

export const modalKinds: ModalKind[] = ["masterclass", "coworking", "certificate", "corporate", "family", "success"];

export const book = {
  masterclass: (id?: string) => (id ? `?book=masterclass&id=${id}` : "?book=masterclass"),
  coworking: (tariff?: string) => (tariff ? `?book=coworking&tariff=${tariff}` : "?book=coworking"),
  certificate: () => "?book=certificate",
  corporate: () => "?book=corporate",
  family: () => "?book=family",
};

/** Ссылка на мессенджер/соцсеть или запасной якорь, пока ссылка не задана */
export function social(url: string) {
  return url || "#contacts";
}
