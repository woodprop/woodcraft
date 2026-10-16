import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, isAdminToken } from "./session";

/**
 * Проверка входа. Вызывается в каждой странице и каждом Server Action админки:
 * proxy.ts — только первая линия защиты.
 */
export async function requireAdmin() {
  const value = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!(await isAdminToken(value))) redirect("/admin/login");
}
