import { requirePermission } from "@/lib/supabase/guard";
import { createClient } from "@/lib/supabase/server";
import MaterialsView from "./view";

export const dynamic = "force-dynamic";

export default async function MaterialsPage() {
  await requirePermission("material.report.own");
  const supabase = createClient();

  const [{ data: materials }, { data: projects }] = await Promise.all([
    supabase.from("material_reports").select("*, projects(name)").order("created_at", { ascending: false }).limit(50),
    supabase.from("projects").select("id, name").eq("archived", false).neq("status", "completed"),
  ]);

  return <MaterialsView materials={(materials ?? []) as never[]} projects={projects ?? []} />;
}
