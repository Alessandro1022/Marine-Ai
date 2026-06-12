import AppShell from "@/components/AppShell";
import { requireUser } from "@/lib/supabase/guard";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireUser();
  const supabase = createClient();

  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", profile.id)
    .eq("read", false);

  return (
    <AppShell role={profile.role} userName={profile.full_name} unread={count ?? 0}>
      {children}
    </AppShell>
  );
}
