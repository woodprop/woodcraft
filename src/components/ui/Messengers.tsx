import { Facebook, Telegram, WhatsApp } from "@/components/ui/Icons";
import { social } from "@/lib/links";
import type { Contacts } from "@/lib/types";
import s from "./Messengers.module.css";

export function Messengers({ contacts }: { contacts: Contacts }) {
  const items = [
    { href: contacts.whatsapp, label: "WhatsApp", Icon: WhatsApp },
    { href: contacts.telegram, label: "Telegram", Icon: Telegram },
    { href: contacts.facebook, label: "Facebook", Icon: Facebook },
  ];
  return (
    <div className={s.msgr}>
      {items.map(({ href, label, Icon }) => (
        <a
          key={label}
          className="btn btn-o"
          href={social(href)}
          {...(href ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        >
          <Icon />
          {label}
        </a>
      ))}
    </div>
  );
}
