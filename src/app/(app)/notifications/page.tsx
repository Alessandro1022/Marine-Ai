import { requirePermission } from "@/lib/supabase/guard";
import { createClient } from "@/lib/supabase/server";
import NotificationsView from "./view";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const { profile } = await requirePermission("notifications.read.own");
  const supabase = createClient();
  const { data } = await supabase.from("notifications").select("*")
    .eq("user_id", profile.id).order("created_at", { ascending: false }).limit(50);

  return <NotificationsView items={data ?? []} />;
}
