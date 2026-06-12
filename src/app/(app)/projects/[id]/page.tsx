import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/supabase/guard";
import { createClient } from "@/lib/supabase/server";
import { hasPermission } from "@/lib/rbac";
import { entryMinutes } from "@/lib/utils";
import ProjectDetailView from "./view";

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  const { profile } = await requirePermission("projects.read.assigned");
  const supabase = createClient();

  const { data: project } = await supabase.from("projects").select("*").eq("id", params.id).single();
  if (!project) notFound();

  const canFinance = hasPermission(profile.role, "finance.read");
  const canEdit = hasPermission(profile.role, "projects.edit");

  const [{ data: orders }, { data: time }, { data: materials }, { data: company }, { data: members }, { data: team }] =
    await Promise.all([
      supabase.from("work_orders").select("*, profiles:assignee_id(full_name)").eq("project_id", project.id),
      supabase.from("time_entries").select("*").eq("project_id", project.id),
      supabase.from("material_reports").select("*").eq("project_id", project.id),
      supabase.from("companies").select("*").single(),
      supabase.from("project_members").select("user_id, profiles(full_name)").eq("project_id", project.id),
      canEdit ? supabase.from("profiles").select("id, full_name, role").eq("status", "active") : Promise.resolve({ data: [] }),
    ]);

  const hourlyCost = company?.default_hourly_cost ?? 450;
  const laborMinutes = (time ?? []).reduce((s, e) => s + entryMinutes(e.started_at, e.ended_at, e.break_minutes), 0);
  const laborCost = (laborMinutes / 60) * hourlyCost;
  const materialCost = (materials ?? []).reduce((s, m) => s + m.quantity * m.unit_cost, 0);

  return (
    <ProjectDetailView
      project={project}
      orders={(orders ?? []) as never[]}
      finance={canFinance ? { laborHours: laborMinutes / 60, laborCost, materialCost, budget: project.budget } : null}
      canEdit={canEdit}
      members={(members ?? []).map((m: { user_id: string; profiles: { full_name: string } | { full_name: string }[] | null }) => ({
        user_id: m.user_id,
        name: Array.isArray(m.profiles) ? m.profiles[0]?.full_name ?? "?" : m.profiles?.full_name ?? "?",
      }))}
      team={(team ?? []) as { id: string; full_name: string; role: string }[]}
    />
  );
}
