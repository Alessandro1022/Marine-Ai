import { requirePermission } from "@/lib/supabase/guard";
import { createClient } from "@/lib/supabase/server";
import { hasPermission } from "@/lib/rbac";
import ProjectsView from "./view";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const { profile } = await requirePermission("projects.read.assigned");
  const supabase = createClient();
  const { data: projects } = await supabase
    .from("projects").select("*").eq("archived", false)
    .order("created_at", { ascending: false });

  return (
    <ProjectsView
      projects={projects ?? []}
      canCreate={hasPermission(profile.role, "projects.create")}
      canFinance={hasPermission(profile.role, "finance.read")}
    />
  );
}
