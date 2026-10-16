"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useBooking } from "@/components/providers/BookingProvider";
import { Dialog } from "@/components/ui/Dialog";
import { modalKinds, type ModalKind } from "@/lib/links";
import type { Content } from "@/lib/types";
import { CertificateModal } from "./CertificateModal";
import { CorporateModal } from "./CorporateModal";
import { CoworkingModal } from "./CoworkingModal";
import { FamilyModal } from "./FamilyModal";
import { MasterclassModal } from "./MasterclassModal";
import { SuccessModal } from "./SuccessModal";

export type ModalData = Pick<Content, "masterclasses" | "tariffs" | "booking" | "contacts" | "coworking" | "prices">;

type Shown = { kind: ModalKind; id: string | null; tariff: string | null };

/**
 * Показывает модалку по параметру ?book=… в адресе.
 * Пока окно закрывается с анимацией, держим последнее содержимое.
 */
export function ModalHost({ data }: { data: ModalData }) {
  const params = useSearchParams();
  const { close } = useBooking();
  const raw = params.get("book");
  const kind = modalKinds.includes(raw as ModalKind) ? (raw as ModalKind) : null;
  const id = params.get("id");
  const tariff = params.get("tariff");

  // запоминаем последнюю открытую модалку (обновление состояния во время рендера —
  // рекомендованный React способ «подстроить» state под новые props)
  const [shown, setShown] = useState<Shown | null>(null);
  if (kind && (shown?.kind !== kind || shown.id !== id || shown.tariff !== tariff)) {
    setShown({ kind, id, tariff });
  }

  const current = kind ? { kind, id, tariff } : shown;
  const key = current ? `${current.kind}-${current.id ?? ""}-${current.tariff ?? ""}` : "none";

  return (
    <Dialog open={!!kind} onClose={close} labelledBy="modal-title">
      {current && (
        <Content key={key} shown={current} data={data} />
      )}
    </Dialog>
  );
}

function Content({ shown, data }: { shown: Shown; data: ModalData }) {
  switch (shown.kind) {
    case "masterclass":
      return <MasterclassModal items={data.masterclasses} initialId={shown.id} />;
    case "coworking":
      return <CoworkingModal tariffs={data.tariffs} schedule={data.coworking} initialTariff={shown.tariff} />;
    case "certificate":
      return <CertificateModal masterclasses={data.masterclasses} sums={data.booking.certificateSums} formats={data.booking.certificateFormats} />;
    case "corporate":
      return <CorporateModal sizes={data.booking.corporateSizes} products={data.booking.corporateProducts} />;
    case "family":
      return <FamilyModal products={data.booking.familyProducts} sessions={data.booking.familySessions} price={data.booking.familyPrice} prices={data.prices} />;
    case "success":
      return <SuccessModal instagram={data.contacts.instagram} />;
  }
}
