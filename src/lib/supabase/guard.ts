import { redirect } from "next/navigation";
import { createClient } from "./server";
import { hasPermission, type Permission } from "@/lib/rbac";
import type { Profile } from "@/lib/types";

/**
 * Backend permission validation.
 * Every protected page and server action goes through this.
 */
export async function requireUser(): Promise<{ profile: Profile }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/register");
  if (profile.status !== "active") redirect("/login?suspended=1");

  return { profile: profile as Profile };
}

export async function requirePermission(permission: Permission): Promise<{ profile: Profile }> {
  const { profile } = await requireUser();
  if (!hasPermission(profile.role, permission)) redirect("/dashboard");
  return { profile };
}

/** For server actions: throws instead of redirecting */
export async function assertPermission(permission: Permission): Promise<Profile> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from("profiles").select("*").eq("id", user.id).single();

  if (!profile || profile.status !== "active") throw new Error("No active profile");
  if (!hasPermission(profile.role as Profile["role"], permission)) {
    throw new Error("Permission denied: " + permission);
  }
  return profile as Profile;
}
