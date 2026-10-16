"use client";

import { saveSeo } from "@/app/admin/actions";
import { fillPrices, priceTokens } from "@/lib/pricing";
import type { Prices, Seo } from "@/lib/types";
import { PageHead, TextField } from "./ui";
import { SaveBar, useEditor } from "./useEditor";
import s from "./admin.module.css";

export function SeoForm({ initial, prices, siteUrl }: { initial: Seo; prices: Prices; siteUrl: string }) {
  const ed = useEditor(initial, saveSeo);
  const { draft, set, err } = ed;
  const title = fillPrices(draft.title, prices);
  const description = fillPrices(draft.description, prices);
  const host = siteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");

  return (
    <>
      <PageHead
        title="SEO"
        sub="Заголовок и описание главной страницы — так сайт выглядит в Google и в превью ссылки в мессенджерах."
      />

      <section className={s.card}>
        <div className={s.stack}>
          <TextField
            label="Title — заголовок"
            hint="Главное: что это и где. Например, «Столярная мастерская в Тбилиси»."
            value={draft.title}
            onChange={(v) => set("title", v)}
            error={err("title")}
            max={120}
            good={[30, 60]}
          />
          <TextField
            label="Meta Description — описание"
            hint="1–2 предложения: что предлагаете и почему стоит прийти."
            value={draft.description}
            onChange={(v) => set("description", v)}
            error={err("description")}
            max={320}
            good={[120, 160]}
            multiline
            rows={3}
          />
          <div className={s.hint}>
            Чтобы цены в тексте менялись сами, пишите метки в фигурных скобках:{" "}
            {priceTokens.map((t, i) => (
              <span key={t.key}>
                {i > 0 && ", "}
                <code>{`{${t.key}}`}</code> — {t.label} (сейчас {prices[t.key]} ₾)
              </span>
            ))}
            .
          </div>
        </div>
      </section>

      <section className={s.card}>
        <h2 className={s.h2} style={{ marginBottom: 16 }}>
          Как это будет выглядеть в Google
        </h2>
        <div className={s.serp}>
          <div className={s.serpUrl}>{host}</div>
          <div className={s.serpTitle}>{title || "Заголовок не заполнен"}</div>
          <div className={s.serpDesc}>{description || "Описание не заполнено"}</div>
        </div>
        <p className={s.hint} style={{ marginTop: 12 }}>
          Google сам решает, сколько текста показать: обычно около 60 символов заголовка и 160 символов описания.
        </p>
      </section>

      <SaveBar editor={ed} />
    </>
  );
}
