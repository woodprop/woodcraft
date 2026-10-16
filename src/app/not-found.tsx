import Link from "next/link";
import { getDict } from "@/i18n";
import { LogoMark } from "@/components/ui/Logo";
import s from "./not-found.module.css";

export default function NotFound() {
  const dict = getDict();
  const d = dict.notFound;
  return (
    <main className="page">
      <section className={s.card}>
        <Link href="/" className={s.logo} aria-label={dict.nav.home}>
          <LogoMark size={40} tone="dark" />
          <span>{dict.brand.name}</span>
        </Link>
        <p className={s.code} aria-hidden="true">
          404
        </p>
        <h1 className="h2">{d.title}</h1>
        <p className="lead">{d.text}</p>
        <div className="btns">
          <Link className="btn btn-d" href="/">
            {d.cta}
          </Link>
        </div>
      </section>
    </main>
  );
}
