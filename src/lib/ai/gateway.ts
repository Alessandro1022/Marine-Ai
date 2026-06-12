/**
 * AI GATEWAY — provider-agnostic seam for every AI module.
 *
 * All AI features (voice→time, project analysis, cost forecasts, invoicing)
 * call this gateway, never a provider SDK directly. Swapping Gemini/Claude/
 * OpenAI later = editing ONE function. Each task gets typed input/output so
 * UI code is fully decoupled from the model layer.
 */

export type AiTask = "voice_to_time" | "project_analysis" | "cost_forecast" | "invoice_draft";

export interface VoiceToTimeInput { transcript: string; projects: { id: string; name: string }[]; lang: "sv" | "en" }
export interface VoiceToTimeOutput { project_id: string | null; started_at: string; ended_at: string; break_minutes: number; overtime_minutes: number; comment: string }

export interface ProjectAnalysisInput { project: Record<string, unknown>; hours: number; laborCost: number; materialCost: number; budget: number; lang: "sv" | "en" }
export interface ProjectAnalysisOutput { summary: string; risks: string[]; recommendations: string[]; health: "green" | "amber" | "red" }

export interface CostForecastInput { history: { week: string; cost: number }[]; budget: number; weeksRemaining: number }
export interface CostForecastOutput { projectedTotal: number; overrunRisk: number; weekly: { week: string; projected: number }[] }

export interface InvoiceDraftInput { projectName: string; customer: string; hours: number; billingRate: number; materials: { name: string; total: number }[]; lang: "sv" | "en" }
export interface InvoiceDraftOutput { lines: { description: string; amount: number }[]; total: number; notes: string }

type TaskIO = {
  voice_to_time: { input: VoiceToTimeInput; output: VoiceToTimeOutput };
  project_analysis: { input: ProjectAnalysisInput; output: ProjectAnalysisOutput };
  cost_forecast: { input: CostForecastInput; output: CostForecastOutput };
  invoice_draft: { input: InvoiceDraftInput; output: InvoiceDraftOutput };
};

export class AiNotConfiguredError extends Error {
  constructor() { super("AI provider not configured. Set AI_PROVIDER + API key in env."); }
}

/**
 * The single switch point. When a module ships:
 *   1. set AI_PROVIDER=gemini (or anthropic) + key in Vercel env
 *   2. implement the provider branch below
 * Until then every call fails loudly and safely.
 */
export async function runAiTask<T extends AiTask>(
  task: T,
  input: TaskIO[T]["input"]
): Promise<TaskIO[T]["output"]> {
  const provider = process.env.AI_PROVIDER;

  switch (provider) {
    // case "gemini":    return geminiRun(task, input);
    // case "anthropic": return anthropicRun(task, input);
    default:
      throw new AiNotConfiguredError();
  }
}
