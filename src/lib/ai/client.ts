export interface ChatMsg {
  role: "user" | "assistant";
  content: string;
}

interface StreamChatOptions {
  messages: ChatMsg[];
  locale?: string;
  context?: string;
  onChunk?: (chunk: string) => void;
}

const SYSTEM_PROMPT = (locale: string, context?: string) => `
You are Empire Marine AI, an expert maritime assistant. 
Answer in ${locale === "sv" ? "Swedish" : "English"}.
Be concise, practical, and safety-focused.
${context ? `\nContext: ${context}` : ""}
`.trim();

export async function streamChat({
  messages,
  locale = "en",
  context,
  onChunk,
}: StreamChatOptions): Promise<string> {
  const res = await fetch("/api/ai/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, locale, context }),
  });

  if (!res.ok || !res.body) throw new Error("AI request failed");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let full = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    full += chunk;
    onChunk?.(chunk);
  }

  return full;
}
