import { requirePermission } from "@/lib/supabase/guard";
import { createClient } from "@/lib/supabase/server";
import { entryMinutes, daysAgoISO } from "@/lib/utils";
import LeaksView, { type Leak } from "./view";

export const dynamic = "force-dynamic";

export default async function LeaksPage() {
  await requirePermission("leaks.read");
  const supabase = createClient();

  // ONE parallel fetch — no N+1, fast even with many projects
  const [{ data: company }, { data: projects }, { data: team }, { data: allTime }, { data: materials }, { data: orders }] =
    await Promise.all([
      supabase.from("companies").select("*").single(),
      supabase.from("projects").select("*").eq("archived", false).neq("status", "completed"),
      supabase.from("profiles").select("id, full_name, role, status"),
      supabase.from("time_entries").select("user_id, project_id, started_at, ended_at, break_minutes"),
      supabase.from("material_reports").select("project_id, quantity, unit_cost"),
      supabase.from("work_orders").select("*, projects(name)").neq("status", "done"),
    ]);

  const hourlyCost = company?.default_hourly_cost ?? 450;
  const billingRate = company?.default_billing_rate ?? 750;
  const weekCutoff = new Date(daysAgoISO(7)).getTime();
  const leaks: Leak[] = [];

  // Pre-aggregate: labor cost per project + recent activity per user (single pass)
  const laborByProject = new Map<string, number>();
  const recentByUser = new Set<string>();
  for (const e of allTime ?? []) {
    const min = entryMinutes(e.started_at, e.ended_at, e.break_minutes);
    if (e.project_id) {
      laborByProject.set(e.project_id, (laborByProject.get(e.project_id) ?? 0) + (min / 60) * hourlyCost);
    }
    if (new Date(e.started_at).getTime() >= weekCutoff) recentByUser.add(e.user_id);
  }
  const matByProject = new Map<string, number>();
  const projectHasMaterial = new Set<string>();
  for (const m of materials ?? []) {
    matByProject.set(m.project_id, (matByProject.get(m.project_id) ?? 0) + m.quantity * m.unit_cost);
    projectHasMaterial.add(m.project_id);
  }
  const weekHoursByProject = new Map<string, number>();
  for (const e of allTime ?? []) {
    if (!e.project_id || new Date(e.started_at).getTime() < weekCutoff) continue;
    weekHoursByProject.set(
      e.project_id,
      (weekHoursByProject.get(e.project_id) ?? 0) + entryMinutes(e.started_at, e.ended_at, e.break_minutes) / 60
    );
  }

  // 1) Missing time reports
  const silent = (team ?? []).filter(
    (u) => u.status === "active" && ["worker", "intern"].includes(u.role) && !recentByUser.has(u.id)
  );
  if (silent.length > 0) {
    leaks.push({
      type: "missing_time",
      title: silent.map((u) => u.full_name).join(", "),
      detail: `${silent.length}`,
      cost: silent.length * 8 * 2 * billingRate,
    });
  }

  // 2) Overdue work orders
  for (const o of orders ?? []) {
    if (!o.due_date || new Date(o.due_date) >= new Date()) continue;
    const daysLate = Math.ceil((Date.now() - new Date(o.due_date).getTime()) / 86_400_000);
    leaks.push({
      type: "overdue_order",
      title: o.title,
      detail: (o.projects as { name: string } | null)?.name ?? "",
      cost: Math.min(daysLate, 10) * 4 * hourlyCost,
    });
  }

  // 3) Budget risk / over budget
  for (const p of projects ?? []) {
    if (!p.budget || p.budget <= 0) continue;
    const spent = (laborByProject.get(p.id) ?? 0) + (matByProject.get(p.id) ?? 0);
    const pct = (spent / p.budget) * 100;
    if (pct >= 100) {
      leaks.push({ type: "over_budget", title: p.name, detail: `${Math.round(pct)}%`, cost: spent - p.budget });
    } else if (pct >= 85) {
      leaks.push({ type: "budget_risk", title: p.name, detail: `${Math.round(pct)}%`, cost: p.budget - spent });
    }
  }

  // 4) Unreported material
  for (const p of projects ?? []) {
    const hours = weekHoursByProject.get(p.id) ?? 0;
    if (hours >= 16 && !projectHasMaterial.has(p.id)) {
      leaks.push({ type: "unreported_material", title: p.name, detail: `${hours.toFixed(0)}h`, cost: hours * billingRate * 0.3 });
    }
  }

  leaks.sort((a, b) => b.cost - a.cost);
  return <LeaksView leaks={leaks} />;
}
