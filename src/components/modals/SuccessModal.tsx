"use client";

import { useBooking } from "@/components/providers/BookingProvider";
import { useDict } from "@/components/providers/DictProvider";
import { Check, Info, Instagram } from "@/components/ui/Icons";
import { social } from "@/lib/links";
import { ModalFrame, ms } from "./ModalFrame";
import s from "./SuccessModal.module.css";

export function SuccessModal({ instagram }: { instagram: string }) {
  const d = useDict().modal.success;
  const { summary, close } = useBooking();
  return (
    <ModalFrame narrow>
      <span className={s.ok}>
        <Check size={36} strokeWidth={2.2} />
      </span>
      <div className={s.text}>
        <h2 className={s.h} id="modal-title">
          {d.title}
        </h2>
        <p className="txt">{d.text}</p>
      </div>
      {summary.length > 0 && (
        <ul className={s.sum}>
          {summary.map(([k, v]) => (
            <li key={k}>
              <span className="mono">{k}</span>
              <b>{v}</b>
            </li>
          ))}
        </ul>
      )}
      <p className={s.tip}>
        <Info size={20} />
        <span>{d.tip}</span>
      </p>
      <div className={`btns ${s.btns}`}>
        <button type="button" className={`btn btn-d ${ms.submit}`} onClick={close}>
          {d.back}
        </button>
        <a className="btn btn-o" href={social(instagram)} {...(instagram ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
          <Instagram />
          {d.insta}
        </a>
      </div>
    </ModalFrame>
  );
}
