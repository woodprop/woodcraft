import { Fragment } from "react";

/** Рендерит текст, где *фрагмент* выделяется маркером (.mk) */
export function Hl({ text }: { text: string }) {
  const parts = text.split(/\*([^*]+)\*/g);
  return (
    <>
      {parts.map((p, i) =>
        i % 2 === 1 ? (
          <span className="mk" key={i}>
            {p}
          </span>
        ) : (
          <Fragment key={i}>{p}</Fragment>
        ),
      )}
    </>
  );
}

/** Убирает разметку выделения — для aria-label, title и т. п. */
export function plain(text: string) {
  return text.replace(/\*/g, "");
}
