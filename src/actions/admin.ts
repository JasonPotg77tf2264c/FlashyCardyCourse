"use server";

import { auth } from "@clerk/nextjs/server";
import { createClerkClient } from "@clerk/backend";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { logAdminPrivilegeChange } from "@/db/queries/admin";

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

const toggleGrantSchema = z.object({
  targetUserId: z.string().min(1),
  grant: z.boolean(),
});

type ToggleGrantInput = z.infer<typeof toggleGrantSchema>;

export async function toggleAdminGrantAction(data: ToggleGrantInput) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const parsed = toggleGrantSchema.safeParse(data);
  if (!parsed.success) throw new Error("Invalid input");

  const caller = await clerkClient.users.getUser(userId);
  const callerRole = (caller.publicMetadata as { role?: string })?.role;
  if (callerRole !== "admin") throw new Error("Forbidden");

  const { targetUserId, grant } = parsed.data;
  if (targetUserId === userId) throw new Error("Cannot modify your own access");

  // Clerk updateUserMetadata does a shallow merge; setting a key to null removes it.
  await clerkClient.users.updateUserMetadata(targetUserId, {
    publicMetadata: { adminGranted: grant ? true : null } as Record<string, unknown>,
  });

  revalidatePath("/admin");
}

const toggleAdminRoleSchema = z.object({
  targetUserId: z.string().min(1),
  targetUserName: z.string().min(1),
  grant: z.boolean(),
});

type ToggleAdminRoleInput = z.infer<typeof toggleAdminRoleSchema>;

export async function toggleAdminRoleAction(data: ToggleAdminRoleInput) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const parsed = toggleAdminRoleSchema.safeParse(data);
  if (!parsed.success) throw new Error("Invalid input");

  const caller = await clerkClient.users.getUser(userId);
  const callerMeta = caller.publicMetadata as { role?: string };
  if (callerMeta?.role !== "admin") throw new Error("Forbidden");

  const { targetUserId, targetUserName, grant } = parsed.data;
  if (targetUserId === userId) throw new Error("Cannot modify your own admin role");

  await clerkClient.users.updateUserMetadata(targetUserId, {
    publicMetadata: { role: grant ? "admin" : null } as Record<string, unknown>,
  });

  const callerName =
    [caller.firstName, caller.lastName].filter(Boolean).join(" ") ||
    caller.username ||
    caller.id;

  await logAdminPrivilegeChange({
    targetUserId,
    targetUserName,
    grantedByUserId: userId,
    grantedByName: callerName,
    action: grant ? "granted" : "revoked",
  });

  revalidatePath("/admin");
}

const toggleUserBanSchema = z.object({
  targetUserId: z.string().min(1),
  ban: z.boolean(),
});

type ToggleUserBanInput = z.infer<typeof toggleUserBanSchema>;

export async function toggleUserBanAction(data: ToggleUserBanInput) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const parsed = toggleUserBanSchema.safeParse(data);
  if (!parsed.success) throw new Error("Invalid input");

  const caller = await clerkClient.users.getUser(userId);
  const callerMeta = caller.publicMetadata as { role?: string };
  if (callerMeta?.role !== "admin") throw new Error("Forbidden");

  const { targetUserId, ban } = parsed.data;
  if (targetUserId === userId) throw new Error("Cannot ban your own account");

  // Prevent banning another admin to avoid lock-out scenarios.
  const target = await clerkClient.users.getUser(targetUserId);
  const targetRole = (target.publicMetadata as { role?: string })?.role;
  if (targetRole === "admin") throw new Error("Cannot ban another admin account");

  if (ban) {
    await clerkClient.users.banUser(targetUserId);
  } else {
    await clerkClient.users.unbanUser(targetUserId);
  }

  revalidatePath("/admin");
}
