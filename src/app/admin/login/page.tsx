import { LogoMark } from "@/components/ui/Logo";
import { LoginForm } from "@/components/admin/LoginForm";
import s from "@/components/admin/admin.module.css";

export default function LoginPage() {
  const devHint = process.env.NODE_ENV !== "production" && !process.env.ADMIN_PASSWORD;
  return (
    <main className={s.login}>
      <div className={s.loginCard}>
        <LogoMark size={48} tone="dark" />
        <div>
          <h1 className={s.h1}>Вход в админку</h1>
          <p className={s.sub}>Здесь меняются даты мастер-классов, цены, расписание, галерея, отзывы и SEO.</p>
        </div>
        <LoginForm />
        {devHint && (
          <p className={s.hint}>
            Режим разработки: пароль <b>admin</b>. Для своего пароля задайте ADMIN_PASSWORD в .env.local.
          </p>
        )}
      </div>
    </main>
  );
}
