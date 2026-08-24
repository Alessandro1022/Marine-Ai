 "use client";

import { useState, useRef, useEffect } from "react";
import { Send, Mic, Plus, MessageCircle, ChevronDown, X } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
}

const QUICK_QUESTIONS = [
  "Starta resa",
  "Väder idag?",
  "Bränsle nivå?",
  "Hur långt?",
  "Hitta hamn",
];

export default function AIPage() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [listening, setListening] = useState(false);
  const [showChatList, setShowChatList] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Load chats from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("marivo_ai_chats");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setChats(parsed);
        if (parsed.length > 0) setCurrentChatId(parsed[0].id);
      } catch (err) {
        console.error("Error loading chats:", err);
      }
    } else {
      newChat();
    }
  }, []);

  // Save chats to localStorage
  useEffect(() => {
    if (chats.length > 0) {
      localStorage.setItem("marivo_ai_chats", JSON.stringify(chats));
    }
  }, [chats]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chats, currentChatId]);

  // Init Web Speech API
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
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
    const newChatId = Date.now().toString();
    const newChat: Chat = {
      id: newChatId,
      title: "Ny chatt",
      messages: [],
      createdAt: Date.now(),
    };
    setChats((prev) => [newChat, ...prev]);
    setCurrentChatId(newChatId);
    setShowSidebar(false);
  }

  function deleteChat(id: string) {
    setChats((prev) => prev.filter((c) => c.id !== id));
    if (currentChatId === id) {
      const remaining = chats.filter((c) => c.id !== id);
      if (remaining.length > 0) {
        setCurrentChatId(remaining[0].id);
      } else {
        newChat();
      }
    }
  }

  async function sendMessage(text: string) {
    if (!text.trim() || !currentChat) return;

    const userMessage: Message = {
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
              messages: [...c.messages, userMessage],
              title:
                c.messages.length === 0
                  ? text.substring(0, 25) + "..."
                  : c.title,
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

      if (!response.ok) throw new Error("API error");
      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response || "Kunde inte få svar.",
      };

      setChats((prev) =>
        prev.map((c) =>
          c.id === currentChatId
            ? { ...c, messages: [...c.messages, assistantMessage] }
            : c
        )
      );
    } catch (error) {
      console.error("AI error:", error);
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
    <div className="flex h-screen bg-deep overflow-hidden">
      {/* SIDEBAR - CHATS */}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-72 bg-deep/95 backdrop-blur-xl border-r border-sonar/10 transition-transform ${
          showSidebar ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-full flex flex-col">
          <div className="p-4 border-b border-sonar/10">
            <button
              onClick={newChat}
              className="w-full px-4 py-3 rounded-xl bg-sonar/25 hover:bg-sonar/35 text-sonar font-medium flex items-center justify-center gap-2 transition"
            >
              <Plus size={18} /> Ny chatt
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {chats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => {
                  setCurrentChatId(chat.id);
                  setShowSidebar(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition group ${
                  currentChatId === chat.id
                    ? "bg-sonar/20 text-sonar"
                    : "text-mist/70 hover:bg-white/5"
                }`}
              >
                <div className="flex justify-between items-start gap-2">
                  <p className="truncate flex-1">{chat.title}</p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteChat(chat.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded transition"
                  >
                    <X size={14} />
                  </button>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* MAIN */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* HEADER */}
        <div className="border-b border-sonar/10 bg-deep/40 backdrop-blur-sm p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="p-2 hover:bg-white/10 rounded-lg transition"
            >
              <MessageCircle size={20} className="text-sonar" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-mist">MARIVIO AI</h1>
              <p className="text-xs text-mist/50">{currentChat?.title || "Ingen chatt"}</p>
            </div>
          </div>
        </div>

        {/* MESSAGES */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
          {!currentChat || currentChat.messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="text-5xl mb-6 text-sonar/20">⚓</div>
              <h2 className="text-lg font-semibold text-mist mb-2">Välkommen till MARIVIO AI</h2>
              <p className="text-xs text-mist/60 mb-8">Din personliga sjöfarts-assistent</p>

              <div className="w-full max-w-xs space-y-3">
                {QUICK_QUESTIONS.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(q)}
                    className="w-full px-4 py-3 rounded-2xl border border-sonar/20 hover:bg-sonar/10 text-sm text-mist/80 transition active:scale-95"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {currentChat.messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-xs px-4 py-3 rounded-2xl text-sm ${
                      msg.role === "user" ? "bg-sonar/25 text-sonar" : "bg-white/10 text-mist"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white/10 px-4 py-3 rounded-2xl">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-mist/60 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-mist/60 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                      <div className="w-2 h-2 bg-mist/60 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* INPUT */}
        <div className="border-t border-sonar/10 bg-deep/60 backdrop-blur-lg p-4">
          <div className="flex gap-2">
            <div className="flex-1 flex items-center gap-2 bg-white/5 border border-sonar/20 rounded-full px-4 py-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && sendMessage(input)}
                placeholder={listening ? "Lyssnar..." : "Fråga något..."}
                className="flex-1 bg-transparent text-sm text-mist placeholder:text-mist/40 focus:outline-none"
                disabled={loading || !currentChat}
              />
              <button
                onClick={toggleVoice}
                className={`p-1.5 rounded-lg transition ${
                  listening ? "bg-red-500/30 text-red-400 animate-pulse" : "text-mist/60 hover:text-mist"
                }`}
                title="Röststyrning (Swedish)"
              >
                <Mic size={18} />
              </button>
            </div>

            <button
              onClick={() => sendMessage(input)}
              disabled={loading || !input.trim() || !currentChat}
              className="p-3 bg-sonar/25 hover:bg-sonar/35 disabled:opacity-50 rounded-full text-sonar transition"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE OVERLAY */}
      {showSidebar && (
        <div className="fixed inset-0 bg-black/50 z-30" onClick={() => setShowSidebar(false)} />
      )}

      {/* BOTTOM NAV SPACING */}
      <div className="h-20" />
    </div>
  );
}
