"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { Lead } from "@/lib/lead";

export type SummaryRow = [string, string];

type Ctx = {
  /** отправляет заявку; при успехе открывает «Заявка принята» */
  submitLead: (lead: Lead, summary: SummaryRow[]) => Promise<boolean>;
  summary: SummaryRow[];
  close: () => void;
};

const BookingCtx = createContext<Ctx | null>(null);

export function BookingProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [summary, setSummary] = useState<SummaryRow[]>([]);

  const close = useCallback(() => {
    router.replace(window.location.pathname, { scroll: false });
  }, [router]);

  const submitLead = useCallback(
    async (lead: Lead, rows: SummaryRow[]) => {
      try {
        const res = await fetch("/api/lead", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(lead),
        });
        if (!res.ok) return false;
        setSummary(rows);
        router.replace("?book=success", { scroll: false });
        return true;
      } catch {
        return false;
      }
    },
    [router],
  );

  const value = useMemo(() => ({ submitLead, summary, close }), [submitLead, summary, close]);
  return <BookingCtx.Provider value={value}>{children}</BookingCtx.Provider>;
}

export function useBooking() {
  const c = useContext(BookingCtx);
  if (!c) throw new Error("useBooking must be used inside <BookingProvider>");
  return c;
}
