import { requirePermission } from "@/lib/supabase/guard";
import { createClient } from "@/lib/supabase/server";
import { creatableRoles } from "@/lib/rbac";
import TeamView from "./view";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const { profile } = await requirePermission("users.read.all");
  const supabase = createClient();
  const { data: team } = await supabase.from("profiles").select("*").neq("status", "deleted").order("role");

  return (
    <TeamView
      team={(team ?? []) as never[]}
      myRole={profile.role}
      roles={creatableRoles(profile.role)}
      canChangeRole={profile.role === "beyer_bey"}
    />
  );
}
