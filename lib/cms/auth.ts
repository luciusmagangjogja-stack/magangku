import "server-only";

import { adminProfileSchema } from "./schemas";
import { canPerformCmsAction, CmsAuthorizationError } from "./authorization";
import type { CmsPermission } from "./types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getCurrentCmsAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (claimsError || typeof userId !== "string") return null;

  const { data, error } = await supabase
    .from("admin_profiles")
    .select("user_id, role, is_active")
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data) return null;

  const profile = adminProfileSchema.safeParse(data);
  if (!profile.success || !profile.data.is_active || profile.data.user_id !== userId) return null;

  return { userId, role: profile.data.role, isActive: profile.data.is_active };
}

export async function requireCmsPermission(permission: CmsPermission) {
  const admin = await getCurrentCmsAdmin();
  const profile = admin
    ? { user_id: admin.userId, role: admin.role, is_active: admin.isActive }
    : null;

  if (!canPerformCmsAction(profile, admin?.userId ?? null, permission)) {
    throw new CmsAuthorizationError();
  }

  return admin!;
}
