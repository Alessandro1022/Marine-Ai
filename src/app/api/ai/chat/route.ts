"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Mic, Loader } from "lucide-react";
import { useAIMemory } from "@/hooks/useAIMemory";
import { buildSystemPrompt } from "@/lib/ai/systemPrompt";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export default function AIPage() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const aiMemory = useAIMemory();

  // Voice setup
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.lang = "sv-SE";
      recognitionRef.current.onstart = () => setListening(true);
      recognitionRef.current.onend = () => setListening(false);
      recognitionRef.current.onresult = (event: any) => {
        const text = Array.from(event.results)
          .map((r: any) => r[0].transcript)
          .join("");
        setInput(text);
      };
    }
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    if (!input.trim() || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      // Format för route.ts
      const context = buildSystemPrompt(aiMemory);

      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          locale: "sv",
          context,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      // Response är text stream, inte JSON!
      const text = await response.text();

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: text,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (error) {
      console.error("Error:", error);
      const errorMsg: Message = {
        id: (Date.now() + 2).toString(),
        role: "assistant",
        content: "Kunde inte få svar från AI. Försök igen senare.",
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  }

  function toggleVoice() {
    if (recognitionRef.current) {
      if (listening) {
        recognitionRef.current.stop();
      } else {
        recognitionRef.current.start();
      }
    }
  }

  return (
    <div className="space-y-4 p-4 pb-28 h-screen flex flex-col">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold text-mist">MARIVIO AI</h1>
        <p className="text-mist/60 text-sm">Din sjöfartsassistent</p>
      </div>

      {/* MESSAGES AREA */}
      <div className="flex-1 overflow-y-auto space-y-3 min-h-96">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <p className="text-mist/60 text-sm">
              Hej! Fråga mig om väder, vägar, säkerhet eller sjöfartsrelaterat
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`px-4 py-2 rounded-lg text-sm max-w-xs ${
                msg.role === "user"
                  ? "bg-sonar/30 text-sonar"
                  : "bg-sonar/10 text-mist"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="px-4 py-2 rounded-lg bg-sonar/10 text-mist flex items-center gap-2">
              <Loader size={16} className="animate-spin" />
              <span className="text-sm">Skriver...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* INPUT AREA */}
      <div className="fixed bottom-0 left-0 right-0 bg-deep border-t border-sonar/20 p-4">
        <div className="max-w-2xl mx-auto flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && sendMessage()}
            placeholder={listening ? "Lyssnar..." : "Fråga något..."}
            disabled={loading}
            className="flex-1 bg-white/5 border border-sonar/20 rounded-full px-4 py-3 text-mist placeholder:text-mist/40 disabled:opacity-50"
          />

          <button
            onClick={toggleVoice}
            disabled={loading}
            className={`p-3 rounded-full transition disabled:opacity-50 ${
              listening
                ? "bg-red-500/30 text-red-400"
                : "bg-sonar/25 text-sonar hover:bg-sonar/35"
            }`}
            title={listening ? "Lyssnar..." : "Aktivera röst"}
          >
            <Mic size={18} />
          </button>

          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="p-3 bg-sonar/25 hover:bg-sonar/35 text-sonar rounded-full transition disabled:opacity-50"
            title="Skicka"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}}
