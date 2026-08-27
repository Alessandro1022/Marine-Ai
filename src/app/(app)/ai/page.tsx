"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Mic } from "lucide-react";
import { buildSystemPrompt } from "@/lib/ai/systemPrompt";
import { useAIMemory } from "@/hooks/useAIMemory";

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

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    if (!input.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const systemPrompt = buildSystemPrompt(aiMemory);

      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input,
          systemPrompt,
          previousMessages: messages.slice(-5),
        }),
      });

      const data = await response.json();

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response || "Kunde inte få svar.",
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (error) {
      console.error("Error:", error);
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
    <div className="space-y-4 p-4 pb-28">
      <h1 className="text-2xl font-bold text-mist">MARIVIO AI</h1>

      <div className="space-y-2 min-h-96 max-h-96 overflow-y-auto">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`px-3 py-2 rounded-lg text-sm max-w-xs ${
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
          <div className="text-mist/50 text-sm">Skriver...</div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="fixed bottom-20 left-0 right-0 px-4">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && sendMessage()}
            placeholder={listening ? "Lyssnar..." : "Fråga något..."}
            className="flex-1 bg-white/5 border border-sonar/20 rounded-full px-4 py-3 text-mist"
          />
          <button
            onClick={toggleVoice}
            className={`p-3 rounded-full ${
              listening
                ? "bg-red-500/30 text-red-400"
                : "bg-sonar/25 text-sonar"
            }`}
          >
            <Mic size={18} />
          </button>
          <button
            onClick={sendMessage}
            className="p-3 bg-sonar/25 text-sonar rounded-full"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
