import { z } from "zod";

export const adminDirectorySchema = z.array(z.object({
  user_id: z.string().uuid(),
  email: z.string().email().nullable(),
  role: z.enum(["owner", "editor"]),
  is_active: z.boolean(),
  created_at: z.string().datetime({ offset: true }),
}).strict());

export const unassignedAdminSchema = z.array(z.object({
  user_id: z.string().uuid(),
  email: z.string().email(),
  created_at: z.string().datetime({ offset: true }),
}).strict());

export const adminActivitySchema = z.array(z.object({
  id: z.string().uuid(),
  actor_email: z.string().email().nullable(),
  action: z.enum(["CREATE", "UPDATE", "DELETE", "UPLOAD", "LOGIN", "LOGOUT"]),
  entity_type: z.string().min(1).max(80),
  entity_id: z.string().nullable(),
  before_data: z.record(z.string(), z.unknown()).nullable(),
  after_data: z.record(z.string(), z.unknown()).nullable(),
  created_at: z.string().datetime({ offset: true }),
}).strict());

export type AdminDirectoryEntry = z.infer<typeof adminDirectorySchema>[number];
export type UnassignedAdminEntry = z.infer<typeof unassignedAdminSchema>[number];
export type AdminActivityEntry = z.infer<typeof adminActivitySchema>[number];