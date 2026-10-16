import { getDict } from "@/i18n";
import { Block } from "@/components/ui/Block";
import { Hl } from "@/components/ui/Hl";
import { Messengers } from "@/components/ui/Messengers";
import type { Contacts, Faq as FaqItem } from "@/lib/types";
import { FaqList } from "./FaqList";
import s from "./Faq.module.css";

export function Faq({ items, contacts }: { items: FaqItem[]; contacts: Contacts }) {
  const d = getDict().faq;
  return (
    <Block id="faq" tab={d.tab} offset={0.923}>
      <div className={`in ${s.grid}`}>
        <div className={s.left}>
          <h2 className="h2" id="faq-h">
            <Hl text={d.title} />
          </h2>
          <p className="txt">{d.text}</p>
          <Messengers contacts={contacts} />
        </div>
        <FaqList items={items} />
      </div>
    </Block>
  );
}
