import { leadTitles, parseLead, type Lead } from "@/lib/lead";

/**
 * Приём заявок с сайта и отправка на email через Resend (https://resend.com).
 * Переменные окружения (.env.local):
 *   RESEND_API_KEY   — ключ API
 *   LEAD_EMAIL_TO    — куда слать заявки (можно несколько через запятую)
 *   LEAD_EMAIL_FROM  — отправитель на подтверждённом домене, например "WoodCraft <site@woodcraft.ge>"
 * Без ключа в режиме разработки заявка просто пишется в консоль.
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false }, { status: 400 });
  }

  // honeypot заполнен — бот; отвечаем «ок», ничего не отправляя
  if (body && typeof body === "object" && (body as { website?: string }).website) {
    return Response.json({ ok: true });
  }

  const lead = parseLead(body);
  if (!lead) return Response.json({ ok: false }, { status: 422 });

  const key = process.env.RESEND_API_KEY;
  const to = process.env.LEAD_EMAIL_TO;
  const from = process.env.LEAD_EMAIL_FROM ?? "WoodCraft <onboarding@resend.dev>";

  if (!key || !to) {
    if (process.env.NODE_ENV !== "production") {
      console.info("[lead] email не настроен, заявка:", JSON.stringify(lead, null, 2));
      return Response.json({ ok: true, dev: true });
    }
    console.error("[lead] RESEND_API_KEY или LEAD_EMAIL_TO не заданы");
    return Response.json({ ok: false }, { status: 503 });
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: to.split(",").map((s) => s.trim()),
      subject: `${leadTitles[lead.kind]} — ${lead.name}`,
      html: renderHtml(lead),
      text: renderText(lead),
    }),
  });

  if (!res.ok) {
    console.error("[lead] Resend ответил", res.status, await res.text());
    return Response.json({ ok: false }, { status: 502 });
  }
  return Response.json({ ok: true });
}

function rows(lead: Lead): [string, string][] {
  return [["Имя", lead.name], ["Телефон", lead.phone], ...lead.fields];
}

function esc(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

function renderHtml(lead: Lead) {
  const tr = rows(lead)
    .map(
      ([k, v]) =>
        `<tr><td style="padding:8px 16px 8px 0;color:#5C544D;vertical-align:top;white-space:nowrap">${esc(k)}</td><td style="padding:8px 0;color:#1C1714">${esc(v).replace(/\n/g, "<br>")}</td></tr>`,
    )
    .join("");
  return `<div style="font-family:system-ui,sans-serif;font-size:15px"><h2 style="margin:0 0 16px">${esc(leadTitles[lead.kind])}</h2><table style="border-collapse:collapse">${tr}</table></div>`;
}

function renderText(lead: Lead) {
  return [leadTitles[lead.kind], "", ...rows(lead).map(([k, v]) => `${k}: ${v}`)].join("\n");
}
