import { requirePermission } from "@/lib/supabase/guard";
import { createClient } from "@/lib/supabase/server";
import { entryMinutes, daysAgoISO } from "@/lib/utils";
import ReportsView from "./view";

export const dynamic = "force-dynamic";

export default async function ReportsPage({ searchParams }: { searchParams: { range?: string } }) {
  await requirePermission("reports.read");
  const supabase = createClient();

  const range = searchParams.range === "quarter" ? 90 : searchParams.range === "month" ? 30 : 7;
  const since = daysAgoISO(range);

  const [{ data: time }, { data: materials }, { data: projects }, { data: team }, { data: company }] =
    await Promise.all([
      supabase.from("time_entries").select("*").gte("started_at", since),
      supabase.from("material_reports").select("*").gte("created_at", since),
      supabase.from("projects").select("*").eq("archived", false),
      supabase.from("profiles").select("id, full_name"),
      supabase.from("companies").select("*").single(),
    ]);

  const hourlyCost = company?.default_hourly_cost ?? 450;
  const projName = new Map((projects ?? []).map((p) => [p.id, p.name]));
  const userName = new Map((team ?? []).map((u) => [u.id, u.full_name]));

  const hoursByProject = new Map<string, number>();
  const hoursByUser = new Map<string, number>();
  for (const e of time ?? []) {
    const h = entryMinutes(e.started_at, e.ended_at, e.break_minutes) / 60;
    if (e.project_id) hoursByProject.set(e.project_id, (hoursByProject.get(e.project_id) ?? 0) + h);
    hoursByUser.set(e.user_id, (hoursByUser.get(e.user_id) ?? 0) + h);
  }

  const matByProject = new Map<string, number>();
  for (const m of materials ?? []) {
    matByProject.set(m.project_id, (matByProject.get(m.project_id) ?? 0) + m.quantity * m.unit_cost);
  }

  const budgetVsActual = (projects ?? [])
    .filter((p) => p.budget > 0)
    .map((p) => ({
      label: p.name,
      value: (hoursByProject.get(p.id) ?? 0) * hourlyCost + (matByProject.get(p.id) ?? 0),
      secondary: p.budget,
    }));

  return (
    <ReportsView
      range={searchParams.range ?? "week"}
      hoursPerProject={[...hoursByProject].map(([id, h]) => ({ label: projName.get(id) ?? "?", value: h }))}
      hoursPerEmployee={[...hoursByUser].map(([id, h]) => ({ label: userName.get(id) ?? "?", value: h }))}
      materialCosts={[...matByProject].map(([id, c]) => ({ label: projName.get(id) ?? "?", value: c }))}
      budgetVsActual={budgetVsActual}
    />
  );
}
