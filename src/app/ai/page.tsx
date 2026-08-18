"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Sparkles, Send, Loader2 } from "lucide-react";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useWeather } from "@/hooks/useWeather";
import { useBoatStore } from "@/stores/boatStore";
import { useI18n } from "@/lib/i18n";
import { streamChat } from "@/lib/ai/client";
import { buildAIContext, formatContextForAI } from "@/lib/services/aiContextBuilder";
import { PageHeader } from "@/components/ui/PageHeader";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export default function AIPage() {
  const { locale } = useI18n();
  const { lat, lon } = useGeolocation();
  const { data: weather } = useWeather(lat, lon);
  const boat = useBoatStore((s) => s.primaryBoat());

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = useCallback(
    async (text: string) => {
      if (!text.trim() || busy) return;

      const context = await buildAIContext(lat, lon, weather, boat);
      const contextStr = formatContextForAI(context);

      const userMsg: Message = {
        id: Date.now().toString(),
        role: "user",
        content: text,
      };
      setMessages((m) => [...m, userMsg]);
      setInput("");
      setBusy(true);

      let assistantText = "";
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "",
      };

      try {
        await streamChat({
          messages: [{ role: "user", content: text }],
          locale,
          context: contextStr,
          onChunk: (chunk) => {
            assistantText += chunk;
            setMessages((m) => [...m.slice(0, -1), { ...assistantMsg, content: assistantText }]);
          },
        });
      } catch (err) {
        assistantText = "Fel: kunde inte nå AI";
      }

      setMessages((m) => [...m.slice(0, -1), { ...assistantMsg, content: assistantText }]);
      setBusy(false);
    },
    [lat, lon, weather, boat, locale, busy]
  );

  return (
    <div className="flex flex-col gap-4 pb-24">
      <PageHeader title="AI-kapten" subtitle="Dina sjöfarer" />

      <div className="flex flex-col gap-3">
        {messages.length === 0 ? (
          <div className="glass-card p-6 text-center">
            <Sparkles size={32} className="mx-auto mb-3 text-sonar" />
            <p className="text-mist">Fråga något om väder, sjökortet eller din segling</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`glass-card p-4 ${msg.role === "user" ? "ml-8 bg-sonar/20" : "mr-8"}`}
            >
              <p className="text-sm leading-relaxed">{msg.content}</p>
            </div>
          ))
        )}
        {busy && (
          <div className="glass-card p-4 mr-8">
            <Loader2 size={16} className="animate-spin text-sonar" />
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="fixed bottom-20 left-5 right-5 max-w-md mx-auto flex gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Fråga något..."
          className="input-field flex-1"
          disabled={busy}
        />
        <button type="submit" disabled={busy || !input.trim()} className="btn-primary !p-2.5">
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
