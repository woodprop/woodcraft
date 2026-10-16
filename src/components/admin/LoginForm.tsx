"use client";

import { useActionState } from "react";
import { login, type LoginState } from "@/app/admin/actions";
import s from "./admin.module.css";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});
  return (
    <form action={action} className={s.stack}>
      <div className={s.field}>
        <label className={s.label} htmlFor="pw">
          Пароль
        </label>
        <input
          id="pw"
          name="password"
          type="password"
          className={s.input}
          autoComplete="current-password"
          autoFocus
          required
          aria-invalid={!!state.error}
          aria-describedby={state.error ? "pw-e" : undefined}
        />
        {state.error && (
          <span id="pw-e" className={s.errText} role="alert">
            {state.error}
          </span>
        )}
      </div>
      <button type="submit" className={`${s.btn} ${s.btnAcc}`} disabled={pending} style={{ width: "100%" }}>
        {pending ? "Входим…" : "Войти"}
      </button>
    </form>
  );
}
