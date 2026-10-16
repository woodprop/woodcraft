"use client";

import Image from "next/image";
import { useRef, useState, type MouseEvent } from "react";
import type { Img } from "@/lib/types";
import { IClose, IImage, IUpload } from "./icons";
import { useToast } from "./Toast";
import s from "./admin.module.css";

/** Сжимаем загруженное фото в браузере: длинная сторона до 1600px, JPEG */
async function compress(file: File): Promise<string> {
  const bmp = await createImageBitmap(file);
  const k = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * k);
  canvas.height = Math.round(bmp.height * k);
  canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  let q = 0.85;
  let url = canvas.toDataURL("image/jpeg", q);
  while (url.length > 1_500_000 && q > 0.4) {
    q -= 0.15;
    url = canvas.toDataURL("image/jpeg", q);
  }
  return url;
}

function parsePos(pos?: string) {
  const [x, y] = (pos ?? "50% 50%").split(" ").map((v) => parseFloat(v));
  return { x: Number.isFinite(x) ? x : 50, y: Number.isFinite(y) ? y : 50 };
}

/**
 * Выбор фото: из уже загруженных на сайт или новое с компьютера.
 * Клик по превью задаёт «главную точку» кадра — она останется видна при обрезке.
 */
export function PhotoPicker({
  value,
  onChange,
  library,
  error,
  label = "Фото",
}: {
  value: Img;
  onChange: (img: Img) => void;
  library: string[];
  error?: string;
  label?: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const file = useRef<HTMLInputElement>(null);
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const pos = parsePos(value.pos);

  const pick = (src: string) => {
    onChange({ src, alt: value.alt, ...(src === value.src && value.pos ? { pos: value.pos } : {}) });
    dialog.current?.close();
  };

  const focus = (e: MouseEvent<HTMLButtonElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - r.left) / r.width) * 100);
    const y = Math.round(((e.clientY - r.top) / r.height) * 100);
    // мобильное кадрирование из старых данных сбрасываем — точка одна для всех экранов
    onChange({ src: value.src, alt: value.alt, pos: `${x}% ${y}%` });
  };

  const upload = async (f?: File) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) return toast("Это не изображение — выберите файл JPG или PNG", true);
    setBusy(true);
    try {
      onChange({ src: await compress(f), alt: value.alt });
    } catch {
      toast("Не получилось прочитать фото. Попробуйте другой файл", true);
    } finally {
      setBusy(false);
      if (file.current) file.current.value = "";
    }
  };

  return (
    <div className={s.field}>
      <span className={s.label}>{label}</span>
      <div className={s.photo}>
        {value.src ? (
          <button type="button" className={s.photoFrame} onClick={focus} aria-label="Выбрать главную точку кадра">
            <Image src={value.src} alt="" fill sizes="220px" style={{ objectPosition: value.pos ?? "50% 50%" }} />
            <span className={s.focus} style={{ left: `${pos.x}%`, top: `${pos.y}%` }} />
          </button>
        ) : (
          <div className={`${s.photoFrame} ${s.empty}`} style={{ display: "grid", placeItems: "center", cursor: "default" }}>
            <IImage size={32} />
          </div>
        )}
        <div className={s.stack}>
          <div className={s.actions}>
            <button type="button" className={`${s.btn} ${s.btnGhost} ${s.btnSm}`} onClick={() => dialog.current?.showModal()}>
              <IImage size={18} /> Выбрать из загруженных
            </button>
            <button type="button" className={`${s.btn} ${s.btnGhost} ${s.btnSm}`} onClick={() => file.current?.click()} disabled={busy}>
              <IUpload size={18} /> {busy ? "Загружаем…" : "Загрузить с компьютера"}
            </button>
            <input ref={file} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => upload(e.target.files?.[0])} />
          </div>
          <p className={s.hint}>
            Нажмите на фото, чтобы отметить главное — эта часть останется видна, когда фото обрежется под карточку.
          </p>
          {value.src.startsWith("data:") && (
            <p className={s.hint}>Демо-режим: загруженное фото хранится до перезапуска сервера.</p>
          )}
          {error && (
            <span className={s.errText} role="alert">
              {error}
            </span>
          )}
        </div>
      </div>

      <dialog ref={dialog} className={s.dialog} aria-label="Выбор фото" onClick={(e) => e.target === dialog.current && dialog.current?.close()}>
        <div className={s.dialogHead}>
          <h2 className={s.h2}>Выберите фото</h2>
          <button type="button" className={s.icb} onClick={() => dialog.current?.close()} aria-label="Закрыть">
            <IClose />
          </button>
        </div>
        <div className={s.dialogBody}>
          <div className={s.lib}>
            {library.map((src) => (
              <button key={src} type="button" className={s.libItem} aria-pressed={src === value.src} onClick={() => pick(src)}>
                <Image src={src} alt={src.startsWith("data:") ? "Загруженное фото" : src.split("/").pop()!} fill sizes="140px" />
              </button>
            ))}
          </div>
        </div>
      </dialog>
    </div>
  );
}
