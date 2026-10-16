import { getDict } from "@/i18n";
import { Block } from "@/components/ui/Block";
import { Hl } from "@/components/ui/Hl";
import { Messengers } from "@/components/ui/Messengers";
import { Photo } from "@/components/ui/Photo";
import type { Contacts } from "@/lib/types";
import { RequestForm } from "./RequestForm";
import s from "./Request.module.css";

export function Request({ contacts }: { contacts: Contacts }) {
  const d = getDict().request;
  return (
    <Block id="contacts" tab={d.tab} offset={1} dark>
      <div className={`in ${s.req}`}>
        <div className={s.left}>
          <h2 className="h2" id="contacts-h">
            <Hl text={d.title} />
          </h2>
          <p className="lead">{d.lead}</p>
          <Photo
            className={s.photo}
            img={{ src: "/images/request.jpg", alt: d.imgAlt, pos: "40% 55%" }}
            sizes="(max-width: 1000px) 100vw, 520px"
          />
          <div className={s.write}>
            <span className="mono">{d.orWrite}</span>
            <Messengers contacts={contacts} />
          </div>
        </div>
        <RequestForm />
      </div>
    </Block>
  );
}
