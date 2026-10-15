"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getCurrentCmsAdmin } from "@/lib/cms/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface LoginState {
  error: string | null;
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(256),
});

export async function loginAdmin(_previousState: LoginState, formData: FormData): Promise<LoginState> {
  const credentials = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!credentials.success) return { error: "Masukkan email dan kata sandi yang valid." };

  let supabase;
  try {
    supabase = await createSupabaseServerClient();
  } catch {
    return { error: "Login admin belum terhubung. Periksa pengaturan Supabase." };
  }

  const { error } = await supabase.auth.signInWithPassword(credentials.data);
  if (error) return { error: "Email atau kata sandi tidak cocok." };

  let admin = null;
  try {
    admin = await getCurrentCmsAdmin();
  } catch {
    await supabase.auth.signOut();
    return { error: "Akun ini belum memiliki akses admin aktif." };
  }

  if (!admin) {
    await supabase.auth.signOut();
    return { error: "Akun ini belum memiliki akses admin aktif." };
  }

  const { error: auditError } = await supabase.rpc("record_site_auth_event", { p_action: "LOGIN" });
  if (auditError) {
    console.error("[admin] login audit failed.", { code: auditError.code ?? "UnknownError" });
    await supabase.auth.signOut();
    return { error: "Login belum dapat dicatat. Coba lagi atau hubungi pemilik akun." };
  }

  redirect("/admin/dashboard");
}

export async function logoutAdmin() {
  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.rpc("record_site_auth_event", { p_action: "LOGOUT" });
    if (error) console.error("[admin] logout audit failed.", { code: error.code ?? "UnknownError" });
    await supabase.auth.signOut();
  } catch {
    // Clear local navigation even if the auth service is unavailable.
  }
  redirect("/admin/login");
}