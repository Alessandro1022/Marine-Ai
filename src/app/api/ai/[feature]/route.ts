import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { MODULES, isModuleEnabled } from "@/lib/modules";
import { hasPermission } from "@/lib/rbac";
import { runAiTask, AiNotConfiguredError, type AiTask } from "@/lib/ai/gateway";
import type { Role } from "@/lib/types";

/**
 * Unified AI endpoint: POST /api/ai/<module-id>
 * Auth → RBAC → feature flag → gateway. New AI modules need ZERO new routes.
 */
const FEATURE_TO_TASK: Record<string, AiTask> = {
  "voice-time": "voice_to_time",
  "ai-analysis": "project_analysis",
  "ai-forecast": "cost_forecast",
  "ai-invoicing": "invoice_draft",
};

export async function POST(req: Request, { params }: { params: { feature: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile || profile.status !== "active") {
    return NextResponse.json({ error: "No active profile" }, { status: 403 });
  }

  const mod = MODULES.find((m) => m.id === params.feature);
  const task = FEATURE_TO_TASK[params.feature];
  if (!mod || !task) return NextResponse.json({ error: "Unknown module" }, { status: 404 });

  if (!hasPermission(profile.role as Role, mod.permission)) {
    return NextResponse.json({ error: "Permission denied" }, { status: 403 });
  }
  if (!(await isModuleEnabled(supabase, profile.company_id, mod.id))) {
    return NextResponse.json({ error: "Module not enabled for this company" }, { status: 403 });
  }

  try {
    const input = await req.json();
    const output = await runAiTask(task, input);
    return NextResponse.json({ ok: true, output });
  } catch (e) {
    if (e instanceof AiNotConfiguredError) {
      return NextResponse.json({ error: e.message, code: "AI_NOT_CONFIGURED" }, { status: 501 });
    }
    return NextResponse.json({ error: "AI task failed" }, { status: 500 });
  }
}
