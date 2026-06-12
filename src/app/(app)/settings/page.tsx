import { requireUser } from "@/lib/supabase/guard";
import { createClient } from "@/lib/supabase/server";
import { hasPermission } from "@/lib/rbac";
import SettingsView from "./view";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const { profile } = await requireUser();
  const supabase = createClient();
  const canManage = hasPermission(profile.role, "company.settings.manage");
  const { data: company } = await supabase.from("companies").select("*").single();

  return <SettingsView company={company} canManage={canManage} />;
}
