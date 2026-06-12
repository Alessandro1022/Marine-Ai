import { requirePermission } from "@/lib/supabase/guard";
import { createClient } from "@/lib/supabase/server";
import TimeView from "./view";

export const dynamic = "force-dynamic";

export default async function TimePage() {
  const { profile } = await requirePermission("time.report.own");
  const supabase = createClient();

  const [{ data: openEntry }, { data: recent }, { data: projects }] = await Promise.all([
    supabase.from("time_entries").select("*").eq("user_id", profile.id).is("ended_at", null).maybeSingle(),
    supabase.from("time_entries").select("*, projects(name)").eq("user_id", profile.id)
      .order("started_at", { ascending: false }).limit(10),
    supabase.from("projects").select("id, name").eq("archived", false).neq("status", "completed"),
  ]);

  return (
    <TimeView
      openEntry={openEntry ?? null}
      recent={(recent ?? []) as never[]}
      projects={projects ?? []}
    />
  );
}
