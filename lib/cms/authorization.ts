import type { AdminProfile } from "./schemas";
import type { CmsPermission } from "./types";

export function canPerformCmsAction(
  profile: AdminProfile | null,
  authenticatedUserId: string | null,
  permission: CmsPermission,
) {
  if (!profile || !authenticatedUserId || profile.user_id !== authenticatedUserId || !profile.is_active) {
    return false;
  }

  return profile.role === "owner" || permission !== "manage_admins";
}

export class CmsAuthorizationError extends Error {
  constructor() {
    super("You are not authorized to perform this CMS action.");
    this.name = "CmsAuthorizationError";
  }
}
