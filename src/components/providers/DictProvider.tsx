"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Dict } from "@/i18n";

const Ctx = createContext<Dict | null>(null);

export function DictProvider({ dict, children }: { dict: Dict; children: ReactNode }) {
  return <Ctx.Provider value={dict}>{children}</Ctx.Provider>;
}

export function useDict(): Dict {
  const d = useContext(Ctx);
  if (!d) throw new Error("useDict must be used inside <DictProvider>");
  return d;
}
