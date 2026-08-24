"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Mic, Plus, MessageCircle, X } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface Chat {
  id: string;
  title: string;
  messages: Message[];
}

export default function AIPage() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [showChats, setShowChats] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Load chats
  useEffect(() => {
    const saved = localStorage.getItem("marivo_chats");
    if (saved) {
      const parsed = JSON.parse(saved);
      setChats(parsed);
      if (parsed.length > 0) setCurrentChatId(parsed[0].id);
    } else {
      newChat();
    }
  }, []);

  // Save chats
  useEffect(() => {
    if (chats.length > 0) {
      localStorage.setItem("marivo_chats", JSON.stringify(chats));
    }
  }, [chats]);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chats]);

  // Voice API
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.lang = "sv-SE";
      recognitionRef.current.onstart = () => setListening(true);
      recognitionRef.current.onend = () => setListening(false);
      recognitionRef.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join("");
        setInput(transcript);
      };
    }
  }, []);

  const currentChat = chats.find((c) => c.id === currentChatId);

  function newChat() {
    const id = Date.now().toString();
    const chat: Chat = {
      id,
      title: "Ny chatt",
      messages: [],
    };
    setChats((prev) => [chat, ...prev]);
    setCurrentChatId(id);
    setShowChats(false);
  }

  function deleteChat(id: string) {
    setChats((prev) => prev.filter((c) => c.id !== id));
    if (currentChatId === id) {
      if (chats.length > 1) {
        setCurrentChatId(chats.find((c) => c.id !== id)?.id || null);
      } else {
        newChat();
      }
    }
  }

  async function sendMessage(text: string) {
    if (!text.trim() || !currentChat) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
    };

    setInput("");
    setLoading(true);

    setChats((prev) =>
      prev.map((c) =>
        c.id === currentChatId
          ? {
              ...c,
              messages: [...c.messages, userMsg],
              title: c.messages.length === 0 ? text.substring(0, 20) : c.title,
            }
          : c
      )
    );

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          previousMessages: currentChat.messages.slice(-5),
        }),
      });

      const data = await response.json();

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response || "Kunde inte få svar.",
      };

      setChats((prev) =>
        prev.map((c) =>
          c.id === currentChatId ? { ...c, messages: [...c.messages, assistantMsg] } : c
        )
      );
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
    <div className="h-screen bg-deep flex flex-col pb-24">
      {/* HEADER - FIXED */}
      <div className="sticky top-0 px-4 py-3 border-b border-sonar/20 bg-deep">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-mist">MARIVIO AI</h1>
            <p className="text-xs text-mist/50">{currentChat?.title || "Ny chatt"}</p>
          </div>
          <button
            onClick={() => setShowChats(!showChats)}
            className="p-2 rounded-lg hover:bg-sonar/10 text-sonar"
          >
            <MessageCircle size={20} />
          </button>
        </div>

        {/* CHAT DROPDOWN */}
        {showChats && (
          <div className="absolute top-16 right-4 w-64 bg-deep border border-sonar/20 rounded-xl shadow-lg z-50">
            <button
              onClick={newChat}
              className="w-full px-4 py-2 text-left text-sm text-sonar hover:bg-sonar/10 border-b border-sonar/20 flex items-center gap-2"
            >
              <Plus size={16} /> Ny chatt
            </button>
            <div className="max-h-64 overflow-y-auto">
              {chats.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => {
                    setCurrentChatId(chat.id);
                    setShowChats(false);
                  }}
                  className={`w-full px-4 py-2 text-left text-xs transition flex justify-between items-center hover:bg-sonar/10 ${
                    currentChatId === chat.id ? "bg-sonar/20 text-sonar" : "text-mist/70"
                  }`}
                >
                  <span className="truncate">{chat.title}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteChat(chat.id);
                    }}
                    className="p-1 hover:bg-red-500/20 rounded"
                  >
                    <X size={12} />
                  </button>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* MESSAGES - SCROLLABLE */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {!currentChat || currentChat.messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="text-4xl mb-4 text-sonar/20">⚓</div>
            <p className="text-mist/60 text-sm">Starta en ny chatt eller välj en gammal</p>
          </div>
        ) : (
          <>
            {currentChat.messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
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
                <div className="bg-sonar/10 px-3 py-2 rounded-lg text-sm text-mist">
                  Skriver...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* INPUT - FIXED */}
      <div className="fixed bottom-20 left-0 right-0 px-4 py-3 bg-deep border-t border-sonar/20">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && sendMessage(input)}
            placeholder={listening ? "Lyssnar..." : "Fråga något..."}
            className="flex-1 bg-white/5 border border-sonar/20 rounded-full px-4 py-2 text-mist text-sm placeholder:text-mist/40 focus:outline-none"
            disabled={loading || !currentChat}
          />
          <button
            onClick={toggleVoice}
            className={`p-2 rounded-full transition ${
              listening
                ? "bg-red-500/30 text-red-400"
                : "bg-sonar/20 text-sonar hover:bg-sonar/30"
            }`}
          >
            <Mic size={18} />
          </button>
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || !currentChat}
            className="p-2 rounded-full bg-sonar/25 hover:bg-sonar/35 disabled:opacity-50 text-sonar transition"
          >
            <Send size={18} />
          </button>
        </div>
      </div>

      {/* OVERLAY */}
      {showChats && (
        <div className="fixed inset-0 z-40" onClick={() => setShowChats(false)} />
      )}
    </div>
  );
}
