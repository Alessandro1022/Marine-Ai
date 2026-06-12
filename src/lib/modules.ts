import type { Permission } from "./rbac";

/**
 * MODULE REGISTRY — the future-proofing layer.
 *
 * Every upcoming capability is a module: declared here once, gated by a
 * feature flag (per company, stored in DB), guarded by a permission, and
 * mounted under a stable route + API namespace.
 *
 * To ship a new module later:
 *   1. flip `status` to "beta"/"live" (or enable per-company in feature_flags)
 *   2. add its pages under src/app/(app)/<id>/
 *   3. add its API under src/app/api/<id>/
 *   4. run its migration from supabase/migrations/
 * Nothing else in the app needs to change.
 */
export type ModuleStatus = "live" | "beta" | "planned";

export interface ModuleDef {
  id: string;
  icon: string;
  /** i18n keys */
  nameKey: string;
  descKey: string;
  status: ModuleStatus;
  permission: Permission;
  /** AI-driven modules route through src/lib/ai/gateway.ts */
  ai?: boolean;
}

export const MODULES: ModuleDef[] = [
  { id: "voice-time",    icon: "🎙", nameKey: "mod_voice_time",    descKey: "mod_voice_time_desc",    status: "planned", permission: "time.report.own",        ai: true },
  { id: "ai-analysis",   icon: "🧠", nameKey: "mod_ai_analysis",   descKey: "mod_ai_analysis_desc",   status: "planned", permission: "reports.read",           ai: true },
  { id: "ai-forecast",   icon: "📈", nameKey: "mod_ai_forecast",   descKey: "mod_ai_forecast_desc",   status: "planned", permission: "finance.read",           ai: true },
  { id: "ai-invoicing",  icon: "🧾", nameKey: "mod_ai_invoicing",  descKey: "mod_ai_invoicing_desc",  status: "planned", permission: "finance.read",           ai: true },
  { id: "gps-checkin",   icon: "📍", nameKey: "mod_gps",           descKey: "mod_gps_desc",           status: "planned", permission: "time.report.own" },
  { id: "client-portal", icon: "🤝", nameKey: "mod_client_portal", descKey: "mod_client_portal_desc", status: "planned", permission: "projects.read.all" },
  { id: "invoices",      icon: "💳", nameKey: "mod_invoices",      descKey: "mod_invoices_desc",      status: "planned", permission: "finance.read" },
  { id: "payroll",       icon: "💰", nameKey: "mod_payroll",       descKey: "mod_payroll_desc",       status: "planned", permission: "finance.read" },
];

/** Server-side check: is a module enabled for this company? */
export async function isModuleEnabled(
  supabase: { from: (t: string) => any },
  companyId: string,
  moduleId: string
): Promise<boolean> {
  const mod = MODULES.find((m) => m.id === moduleId);
  if (!mod) return false;
  if (mod.status === "live") return true;
  const { data } = await supabase
    .from("feature_flags")
    .select("enabled")
    .eq("company_id", companyId)
    .eq("module_id", moduleId)
    .maybeSingle();
  return data?.enabled === true;
}
