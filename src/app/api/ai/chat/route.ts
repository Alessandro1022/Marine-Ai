
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

type Msg = { role: "user" | "assistant"; content: string };

function systemPrompt(locale: string, context?: string) {
  const lang = locale === "sv" ? "Swedish" : "English";
  return [
    "You are Empire Marine AI, an expert marine assistant for recreational boaters in Scandinavia.",
    "You help with weather assessment, route planning, fuel estimation, engine maintenance, seamanship, safety and fishing.",
    "Be concise, practical and safety-first. Use metric units, knots and nautical miles.",
    "If conditions sound dangerous, clearly advise caution.",
    `Always answer in ${lang}.`,
    context ? `Current context:\n${context}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export async function POST(req: NextRequest) {
  const { messages, locale = "sv", context } = (await req.json()) as {
    messages: Msg[];
    locale?: string;
    context?: string;
  };

  const provider = (process.env.AI_PROVIDER ?? "gemini").toLowerCase();
  const system = systemPrompt(locale, context);

  try {
    const stream =
      provider === "openai"
        ? await streamOpenAI(messages, system)
        : await streamGemini(messages, system);
    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "ai_error";
    return Response.json({ error: message }, { status: 500 });
  }
}

async function streamGemini(messages: Msg[], system: string) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY missing");

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse&key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: messages.map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        })),
        generationConfig: { temperature: 0.6, maxOutputTokens: 1024 },
      }),
    }
  );
  if (!res.ok || !res.body) throw new Error(`gemini_${res.status}`);

  return sseToTextStream(res.body, (json) => {
    return json?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  });
}

async function streamOpenAI(messages: Msg[], system: string) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY missing");

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      stream: true,
      messages: [
        { role: "system", content: system },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
    }),
  });
  if (!res.ok || !res.body) throw new Error(`openai_${res.status}`);

  return sseToTextStream(res.body, (json) => {
    return json?.choices?.[0]?.delta?.content ?? "";
  });
}

function sseToTextStream(
  body: ReadableStream<Uint8Array>,
  extract: (json: unknown) => string
) {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = body.getReader();
      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;
            const payload = trimmed.slice(5).trim();
            if (payload === "[DONE]") continue;
            try {
              const text = extract(JSON.parse(payload));
              if (text) controller.enqueue(encoder.encode(text));
            } catch {
              // skip malformed chunk
            }
          }
        }
      } finally {
        controller.close();
      }
    },
  });
}
EOF
# ---- AI client helper ----
cat > src/lib/ai/client.ts << 'EOF'
export type ChatMsg = { role: "user" | "assistant"; content: string };

export async function streamChat(params: {
  messages: ChatMsg[];
  locale: string;
  context?: string;
  onChunk: (text: string) => void;
  signal?: AbortSignal;
}): Promise<string> {
  const res = await fetch("/api/ai/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: params.messages,
      locale: params.locale,
      context: params.context,
    }),
    signal: params.signal,
  });

  if (!res.ok || !res.body) {
    throw new Error("ai_request_failed");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let full = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    const text = decoder.decode(value, { stream: true });
    full += text;
    params.onChunk(text);
  }
  return full;
}
EOF
# ---- Stores ----
cat > src/stores/boatStore.ts << 'EOF'
import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";
import type { Boat } from "@/types";

interface BoatState {
  boats: Boat[];
  loaded: boolean;
  load: () => Promise<void>;
  primaryBoat: () => Boat | null;
}

export const useBoatStore = create<BoatState>((set, get) => ({
  boats: [],
  loaded: false,

  load: async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("boats")
      .select("*")
      .order("is_primary", { ascending: false })
      .order("created_at");
    set({ boats: (data as Boat[]) ?? [], loaded: true });
  },

  primaryBoat: () => {
    const boats = get().boats;
    return boats.find((b) => b.is_primary) ?? boats[0] ?? null;
  },
}));
EOF
cat > src/stores/settingsStore.ts << 'EOF'
import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";

interface SettingsState {
  fuelPriceSek: number;
  loaded: boolean;
  load: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  fuelPriceSek: 25,
  loaded: false,

  load: async () => {
    if (get().loaded) return;
    const supabase = createClient();
    const { data } = await supabase.from("settings").select("*").maybeSingle();
    if (data) set({ fuelPriceSek: Number(data.fuel_price_sek_per_liter) || 25 });
    set({ loaded: true });
  },
}));
