import { requirePermission } from "@/lib/supabase/guard";
import { createClient } from "@/lib/supabase/server";
import { hasPermission } from "@/lib/rbac";
import OrdersView from "./view";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const { profile } = await requirePermission("orders.read.assigned");
  const supabase = createClient();
  const canCreate = hasPermission(profile.role, "orders.create");

  const [{ data: orders }, { data: projects }, { data: team }] = await Promise.all([
    supabase.from("work_orders")
      .select("*, projects(name), profiles:assignee_id(full_name)")
      .order("created_at", { ascending: false }),
    supabase.from("projects").select("id, name").eq("archived", false),
    canCreate ? supabase.from("profiles").select("id, full_name").eq("status", "active") : Promise.resolve({ data: [] }),
  ]);

  return (
    <OrdersView
      orders={(orders ?? []) as never[]}
      projects={projects ?? []}
      team={(team ?? []) as { id: string; full_name: string }[]}
      canCreate={canCreate}
    />
  );
}
