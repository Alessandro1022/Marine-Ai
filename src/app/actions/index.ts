"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { assertPermission } from "@/lib/supabase/guard";
import { creatableRoles } from "@/lib/rbac";
import type { Role } from "@/lib/types";

/* ============ TIME ============ */
export async function startWorkday(projectId: string | null) {
  const profile = await assertPermission("time.report.own");
  const supabase = createClient();

  const { data: open } = await supabase
    .from("time_entries").select("id")
    .eq("user_id", profile.id).is("ended_at", null).limit(1);
  if (open && open.length > 0) throw new Error("Already clocked in");

  const { error } = await supabase.from("time_entries").insert({
    company_id: profile.company_id,
    user_id: profile.id,
    project_id: projectId || null,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/time"); revalidatePath("/dashboard");
}

export async function stopWorkday(entryId: string, breakMin: number, overtimeMin: number, comment: string) {
  const profile = await assertPermission("time.report.own");
  const supabase = createClient();
  const { error } = await supabase.from("time_entries")
    .update({
      ended_at: new Date().toISOString(),
      break_minutes: Math.max(0, breakMin || 0),
      overtime_minutes: Math.max(0, overtimeMin || 0),
      comment: comment?.trim() || null,
    })
    .eq("id", entryId).eq("user_id", profile.id);
  if (error) throw new Error(error.message);
  revalidatePath("/time"); revalidatePath("/dashboard");
}

/* ============ PROJECTS ============ */
export async function createProject(form: {
  name: string; customer: string; address: string;
  start_date: string; end_date: string; budget: number; status: string;
}) {
  const profile = await assertPermission("projects.create");
  const supabase = createClient();
  const { error } = await supabase.from("projects").insert({
    company_id: profile.company_id,
    name: form.name.trim(),
    customer: form.customer?.trim() || null,
    address: form.address?.trim() || null,
    start_date: form.start_date || null,
    end_date: form.end_date || null,
    budget: form.budget || 0,
    status: form.status,
    created_by: profile.id,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/projects"); revalidatePath("/dashboard");
}

export async function updateProjectStatus(projectId: string, status: string) {
  const profile = await assertPermission("projects.edit");
  const supabase = createClient();
  const { error } = await supabase.from("projects")
    .update({ status }).eq("id", projectId).eq("company_id", profile.company_id);
  if (error) throw new Error(error.message);
  revalidatePath("/projects");
}

export async function addProjectMember(projectId: string, userId: string) {
  await assertPermission("projects.edit");
  const supabase = createClient();
  const { error } = await supabase.from("project_members").insert({ project_id: projectId, user_id: userId });
  if (error && !error.message.includes("duplicate")) throw new Error(error.message);
  revalidatePath(`/projects/${projectId}`);
}

/* ============ WORK ORDERS ============ */
export async function createOrder(form: {
  title: string; description: string; priority: string;
  assignee_id: string; project_id: string; due_date: string;
}) {
  const profile = await assertPermission("orders.create");
  const supabase = createClient();
  const { error } = await supabase.from("work_orders").insert({
    company_id: profile.company_id,
    project_id: form.project_id,
    title: form.title.trim(),
    description: form.description?.trim() || null,
    priority: form.priority,
    assignee_id: form.assignee_id || null,
    due_date: form.due_date || null,
    created_by: profile.id,
  });
  if (error) throw new Error(error.message);

  // Notify assignee
  if (form.assignee_id) {
    await supabase.from("notifications").insert({
      company_id: profile.company_id,
      user_id: form.assignee_id,
      type: "new_order",
      title: form.title.trim(),
      body: "Ny arbetsorder tilldelad / New work order assigned",
    });
  }
  revalidatePath("/orders"); revalidatePath("/dashboard");
}

export async function updateOrderStatus(orderId: string, status: string) {
  const profile = await assertPermission("orders.update.own");
  const supabase = createClient();
  // RLS guarantees: assignee or manager within same company
  const { error } = await supabase.from("work_orders")
    .update({ status }).eq("id", orderId).eq("company_id", profile.company_id);
  if (error) throw new Error(error.message);
  revalidatePath("/orders"); revalidatePath("/dashboard");
}

/* ============ MATERIALS ============ */
export async function reportMaterial(form: {
  project_id: string; name: string; quantity: number; unit_cost: number; comment: string;
}) {
  const profile = await assertPermission("material.report.own");
  const supabase = createClient();
  const { error } = await supabase.from("material_reports").insert({
    company_id: profile.company_id,
    project_id: form.project_id,
    user_id: profile.id,
    name: form.name.trim(),
    quantity: form.quantity || 1,
    unit_cost: form.unit_cost || 0,
    comment: form.comment?.trim() || null,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/materials"); revalidatePath("/dashboard");
}

/* ============ TEAM ============ */
export async function createTeamMember(form: {
  full_name: string; email: string; password: string; role: Role;
}) {
  const profile = await assertPermission("users.create.worker");
  if (!creatableRoles(profile.role).includes(form.role)) {
    throw new Error("Permission denied: cannot create role " + form.role);
  }
  const supabase = createClient();

  // Create auth user via standard signup (no service key needed)
  const { data, error } = await supabase.auth.signUp({
    email: form.email.trim(),
    password: form.password,
  });
  if (error || !data.user) throw new Error(error?.message || "Could not create user");

  const { error: rpcError } = await supabase.rpc("attach_profile", {
    target_user: data.user.id,
    target_name: form.full_name.trim(),
    target_email: form.email.trim(),
    target_role: form.role,
  });
  if (rpcError) throw new Error(rpcError.message);

  await supabase.from("audit_logs").insert({
    company_id: profile.company_id, actor_id: profile.id,
    action: "user.create", target: form.email, meta: { role: form.role },
  });
  revalidatePath("/team");
}

export async function setUserStatus(userId: string, status: "active" | "suspended") {
  const profile = await assertPermission("users.suspend");
  const supabase = createClient();

  const { data: target } = await supabase.from("profiles").select("role").eq("id", userId).single();
  if (target?.role === "beyer_bey") throw new Error("Cannot suspend Beyer Bey");
  if (profile.role === "admin" && !["worker", "intern"].includes(target?.role ?? "")) {
    throw new Error("Admin can only suspend Worker and Intern accounts");
  }

  const { error } = await supabase.from("profiles")
    .update({ status }).eq("id", userId).eq("company_id", profile.company_id);
  if (error) throw new Error(error.message);

  await supabase.from("audit_logs").insert({
    company_id: profile.company_id, actor_id: profile.id,
    action: "user." + status, target: userId,
  });
  revalidatePath("/team");
}

export async function changeUserRole(userId: string, role: Role) {
  const profile = await assertPermission("users.role.change"); // beyer_bey only
  if (role === "beyer_bey") throw new Error("Cannot assign Beyer Bey role");
  const supabase = createClient();
  const { error } = await supabase.from("profiles")
    .update({ role }).eq("id", userId).eq("company_id", profile.company_id).neq("role", "beyer_bey");
  if (error) throw new Error(error.message);
  revalidatePath("/team");
}

/* ============ SETTINGS ============ */
export async function updateCompanySettings(form: { name: string; default_hourly_cost: number; default_billing_rate: number }) {
  const profile = await assertPermission("company.settings.manage");
  const supabase = createClient();
  const { error } = await supabase.from("companies").update({
    name: form.name.trim(),
    default_hourly_cost: form.default_hourly_cost,
    default_billing_rate: form.default_billing_rate,
  }).eq("id", profile.company_id);
  if (error) throw new Error(error.message);
  revalidatePath("/settings");
}

/* ============ NOTIFICATIONS ============ */
export async function markAllRead() {
  const profile = await assertPermission("notifications.read.own");
  const supabase = createClient();
  await supabase.from("notifications").update({ read: true }).eq("user_id", profile.id);
  revalidatePath("/notifications");
}
