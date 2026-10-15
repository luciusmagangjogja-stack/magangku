"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { loginAdmin, type LoginState } from "./auth-actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="admin-primary-button login-submit" type="submit" disabled={pending}>
      {pending ? "Memeriksa akun..." : "Masuk"}
    </button>
  );
}

export function LoginForm({ reason }: { reason?: string }) {
  const initialState: LoginState = {
    error:
      reason === "access"
        ? "Akun ini belum memiliki akses admin aktif."
        : reason === "setup"
          ? "Supabase belum dapat dihubungi. Periksa pengaturan koneksi."
          : null,
  };
  const [state, action] = useActionState(loginAdmin, initialState);

  return (
    <form className="admin-login-form" action={action}>
      <label>
        Email
        <input autoComplete="username" name="email" type="email" required maxLength={254} />
      </label>
      <label>
        Kata sandi
        <input autoComplete="current-password" name="password" type="password" required maxLength={256} />
      </label>
      {state.error ? <p className="admin-form-error" role="alert">{state.error}</p> : null}
      <SubmitButton />
    </form>
  );
}