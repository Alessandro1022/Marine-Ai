import { requireUser } from "@/lib/supabase/guard";
import { createClient } from "@/lib/supabase/server";
import { hasPermission } from "@/lib/rbac";
import { startOfDayISO, entryMinutes } from "@/lib/utils";
import DashboardView from "./view";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { profile } = await requireUser();
  const supabase = createClient();
  const canFinance = hasPermission(profile.role, "finance.read");
  const todayISO = startOfDayISO();

  const [{ data: projects }, { data: todayEntries }, { data: company }, { data: orders }] = await Promise.all([
    supabase.from("projects").select("*").eq("archived", false),
    supabase.from("time_entries").select("*").gte("started_at", todayISO),
    supabase.from("companies").select("*").single(),
    supabase.from("work_orders").select("*").neq("status", "done"),
  ]);

  const activeProjects = (projects ?? []).filter((p) => p.status === "active");
  const workersToday = new Set((todayEntries ?? []).map((e) => e.user_id)).size;
  const minutesToday = (todayEntries ?? []).reduce(
    (sum, e) => sum + entryMinutes(e.started_at, e.ended_at, e.break_minutes), 0
  );
  const billingRate = company?.default_billing_rate ?? 750;
  const expectedInvoicing = (minutesToday / 60) * billingRate;

  // Budget calculation per project (labor + materials)
  const hourlyCost = company?.default_hourly_cost ?? 450;
  const projectIds = (projects ?? []).map((p) => p.id);
  let spentByProject: Record<string, number> = {};
  if (projectIds.length > 0 && canFinance) {
    const [{ data: allTime }, { data: allMat }] = await Promise.all([
      supabase.from("time_entries").select("project_id, started_at, ended_at, break_minutes").in("project_id", projectIds),
      supabase.from("material_reports").select("project_id, quantity, unit_cost").in("project_id", projectIds),
    ]);
    for (const e of allTime ?? []) {
      if (!e.project_id) continue;
      spentByProject[e.project_id] =
        (spentByProject[e.project_id] ?? 0) +
        (entryMinutes(e.started_at, e.ended_at, e.break_minutes) / 60) * hourlyCost;
    }
    for (const m of allMat ?? []) {
      spentByProject[m.project_id] = (spentByProject[m.project_id] ?? 0) + m.quantity * m.unit_cost;
    }
  }

  const overBudget = (projects ?? []).filter((p) => p.budget > 0 && (spentByProject[p.id] ?? 0) > p.budget);
  const overdueOrders = (orders ?? []).filter((o) => o.due_date && new Date(o.due_date) < new Date());

  // Missing time: workers with no entry today (managers only see this)
  let missingTimeCount = 0;
  if (hasPermission(profile.role, "users.read.all")) {
    const { data: team } = await supabase.from("profiles").select("id, role, status");
    const reported = new Set((todayEntries ?? []).map((e) => e.user_id));
    missingTimeCount = (team ?? []).filter(
      (u) => u.status === "active" && ["worker", "intern"].includes(u.role) && !reported.has(u.id)
    ).length;
  }

  return (
    <DashboardView
      stats={{
        activeProjects: activeProjects.length,
        workersToday,
        hoursToday: minutesToday / 60,
        expectedInvoicing,
        canFinance,
      }}
      ongoing={activeProjects.map((p) => ({
        id: p.id, name: p.name, customer: p.customer,
        budget: p.budget, spent: spentByProject[p.id] ?? 0,
      }))}
      warnings={{
        missingTime: missingTimeCount,
        overBudget: overBudget.map((p) => p.name),
        overdueOrders: overdueOrders.length,
      }}
    />
  );
}
