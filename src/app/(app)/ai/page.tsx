"use client";

/**
 * MARIVIO AI — sida med:
 * 1. Chatthistorik-meny (sidopanel, som ett fönster med gamla chattar)
 * 2. Röststyrning (svensk taligenkänning, iOS Safari-säker)
 * 3. Resespårning kopplad till loggboken + karta ("Strava för båtar")
 * 4. Bränslenivå-koll (kräver att båten har fuel_level i `boats`-tabellen)
 * 5. Fart/sträcka beräknas live från GPS
 *
 * KRÄVER dessa Supabase-tabeller (skapa om de inte finns):
 *
 * create table ai_conversations (
 *   id uuid primary key default gen_random_uuid(),
 *   user_id uuid references auth.users not null,
 *   title text not null default 'Ny chatt',
 *   created_at timestamptz default now()
 * );
 *
 * create table ai_messages (
 *   id uuid primary key default gen_random_uuid(),
 *   conversation_id uuid references ai_conversations on delete cascade,
 *   role text not null, -- 'user' | 'assistant'
 *   content text not null,
 *   created_at timestamptz default now()
 * );
 *
 * create table trip_points (
 *   id uuid primary key default gen_random_uuid(),
 *   trip_id uuid references trips on delete cascade,
 *   lat double precision not null,
 *   lng double precision not null,
 *   speed_knots double precision,
 *   recorded_at timestamptz default now()
 * );
 *
 * -- Om ni inte redan har en boats-tabell, lägg till fuel_level där:
 * -- alter table boats add column fuel_level numeric; -- 0-100 (%) eller liter, valfritt
 *
 * Bränslenivå kräver antingen manuell inmatning i appen eller en sensorintegration.
 * Utan endera av dem kan AI:n inte svara på riktig bränslenivå — det är hårdvarugränsen,
 * inte något som löses i frontend-koden.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { Send, Mic, MicOff, Menu, X, Plus, Play, Square } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useGeolocation } from "@/hooks/useGeolocation";

interface Conversation {
  id: string;
  title: string;
  created_at: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface RoutePoint {
  lat: number;
  lng: number;
  speed_knots: number | null;
  recorded_at: string;
}

const isIOS =
  typeof navigator !== "undefined" &&
  /iPad|iPhone|iPod/.test(navigator.userAgent);

// Haversine, returnerar distans i nautiska mil
function distanceNm(a: RoutePoint, b: RoutePoint): number {
  const R_NM = 3440.065; // jordens radie i nautiska mil
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R_NM * Math.asin(Math.sqrt(h));
}

export default function AIPage() {
  const supabase = createClient();
  const geo = useGeolocation();

  // Chat state
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Voice state
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const isStartingRef = useRef(false);

  // Trip tracking state
  const [tripActive, setTripActive] = useState(false);
  const [tripStart, setTripStart] = useState<Date | null>(null);
  const [routePoints, setRoutePoints] = useState<RoutePoint[]>([]);
  const [currentSpeedKn, setCurrentSpeedKn] = useState(0);
  const [totalDistanceNm, setTotalDistanceNm] = useState(0);
  const watchIdRef = useRef<number | null>(null);

  // ---------- Ladda chatthistorik ----------
  useEffect(() => {
    loadConversations();
  }, []);

  async function loadConversations() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("ai_conversations")
      .select("id, title, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setConversations((data as Conversation[]) || []);
  }

  async function loadMessages(conversationId: string) {
    const { data } = await supabase
      .from("ai_messages")
      .select("id, role, content")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });
    setMessages((data as Message[]) || []);
    setActiveConversationId(conversationId);
    setSidebarOpen(false);
  }

  function startNewConversation() {
    setActiveConversationId(null);
    setMessages([]);
    setSidebarOpen(false);
  }

  // ---------- Skicka meddelande ----------
  async function sendMessage(text: string) {
    if (!text.trim()) return;
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    let conversationId = activeConversationId;

    // Skapa ny konversation om det behövs
    if (!conversationId) {
      const { data: newConv } = await supabase
        .from("ai_conversations")
        .insert({
          user_id: user.id,
          title: text.slice(0, 40),
        })
        .select()
        .single();
      conversationId = newConv?.id ?? null;
      if (conversationId) {
        setActiveConversationId(conversationId);
        setConversations((prev) => [
          { id: conversationId!, title: text.slice(0, 40), created_at: new Date().toISOString() },
          ...prev,
        ]);
      }
    }

    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    if (conversationId) {
      await supabase.from("ai_messages").insert({
        conversation_id: conversationId,
        role: "user",
        content: text,
      });
    }

    // Kolla om det är ett röst-/textkommando innan vi går till AI-svar
    const handled = await handleCommand(text);
    if (handled) {
      setLoading(false);
      return;
    }

    // TODO: koppla till er faktiska AI-endpoint (Gemini/Claude/etc, se DIVAN-arkitektur)
    const reply = "Jag hörde: " + text;
    const assistantMsg: Message = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: reply,
    };
    setMessages((prev) => [...prev, assistantMsg]);

    if (conversationId) {
      await supabase.from("ai_messages").insert({
        conversation_id: conversationId,
        role: "assistant",
        content: reply,
      });
    }

    setLoading(false);
  }

  // ---------- Kommandotolkning ----------
  async function handleCommand(text: string): Promise<boolean> {
    const t = text.toLowerCase();

    if (t.includes("starta resa") || t.includes("starta loggning")) {
      startTrip();
      pushAssistantMessage("Startar resa och loggar din rutt.");
      return true;
    }

    if (t.includes("avsluta resa") || t.includes("stoppa resa") || t.includes("avsluta loggning")) {
      await stopTrip();
      pushAssistantMessage("Resan sparad i loggboken.");
      return true;
    }

    if (t.includes("bränsle") || t.includes("bränslenivå")) {
      const level = await getFuelLevel();
      pushAssistantMessage(
        level !== null
          ? `Bränslenivån är ${level}%.`
          : "Ingen bränslenivå är kopplad till båten än. Lägg till fuel_level i boats-tabellen eller anslut en sensor."
      );
      return true;
    }

    if (t.includes("hur snabbt") || t.includes("fart")) {
      pushAssistantMessage(`Just nu ${currentSpeedKn.toFixed(1)} knop.`);
      return true;
    }

    if (t.includes("hur långt") || t.includes("sträcka") || t.includes("distans")) {
      pushAssistantMessage(`Ni har åkt ${totalDistanceNm.toFixed(1)} nm hittills.`);
      return true;
    }

    return false;
  }

  function pushAssistantMessage(content: string) {
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "assistant", content },
    ]);
  }

  async function getFuelLevel(): Promise<number | null> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    const { data } = await supabase
      .from("boats")
      .select("fuel_level")
      .eq("user_id", user.id)
      .single();
    return data?.fuel_level ?? null;
  }

  // ---------- Resespårning (Strava-stil) ----------
  function startTrip() {
    if (tripActive) return;
    setTripActive(true);
    setTripStart(new Date());
    setRoutePoints([]);
    setTotalDistanceNm(0);
    setCurrentSpeedKn(0);

    if ("geolocation" in navigator) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const point: RoutePoint = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            speed_knots: pos.coords.speed != null ? pos.coords.speed * 1.94384 : null, // m/s -> knop
            recorded_at: new Date().toISOString(),
          };

          setRoutePoints((prev) => {
            const updated = [...prev, point];
            if (prev.length > 0) {
              const last = prev[prev.length - 1];
              const segment = distanceNm(last, point);
              setTotalDistanceNm((d) => d + segment);
            }
            return updated;
          });

          setCurrentSpeedKn(point.speed_knots ?? 0);
        },
        (err) => console.error("Geolocation error:", err),
        { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 }
      );
    }
  }

  async function stopTrip() {
    if (!tripActive || !tripStart) return;

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    const durationMinutes = Math.round(
      (Date.now() - tripStart.getTime()) / 60000
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user && routePoints.length > 0) {
      const first = routePoints[0];
      const last = routePoints[routePoints.length - 1];

      const { data: trip } = await supabase
        .from("trips")
        .insert({
          user_id: user.id,
          start_location: `${first.lat.toFixed(4)}, ${first.lng.toFixed(4)}`,
          destination: `${last.lat.toFixed(4)}, ${last.lng.toFixed(4)}`,
          trip_date: new Date().toISOString().split("T")[0],
          duration_minutes: durationMinutes,
          distance_nm: totalDistanceNm,
        })
        .select()
        .single();

      // Spara alla ruttpunkter så kartan kan rita upp resan i efterhand
      if (trip?.id) {
        const pointsToInsert = routePoints.map((p) => ({
          trip_id: trip.id,
          lat: p.lat,
          lng: p.lng,
          speed_knots: p.speed_knots,
          recorded_at: p.recorded_at,
        }));
        await supabase.from("trip_points").insert(pointsToInsert);
      }
    }

    setTripActive(false);
    setTripStart(null);
  }

  // ---------- Röststyrning ----------
  const safeStartRecognition = useCallback(() => {
    if (isStartingRef.current || !recognitionRef.current) return;
    isStartingRef.current = true;
    try {
      recognitionRef.current.start();
    } catch (e) {
      // redan startad, ignorera
    }
    setTimeout(() => {
      isStartingRef.current = false;
    }, 300);
  }, []);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = "sv-SE";
    recognition.continuous = !isIOS; // iOS Safari hanterar continuous dåligt
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
      const transcript = event.results[event.results.length - 1][0].transcript;
      sendMessage(transcript);
    };

    recognition.onend = () => {
      if (listening) {
        // starta om automatiskt om vi fortfarande ska lyssna (särskilt viktigt på iOS)
        safeStartRecognition();
      }
    };

    recognition.onerror = (e: any) => {
      console.error("Speech recognition error:", e.error);
      setListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listening]);

  function toggleListening() {
    if (!recognitionRef.current) {
      pushAssistantMessage(
        "Röststyrning stöds inte i den här webbläsaren."
      );
      return;
    }
    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
    } else {
      setListening(true);
      safeStartRecognition();
    }
  }

  return (
    <div className="relative min-h-screen bg-deep flex">
      {/* Sidopanel med gamla chattar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 flex">
          <div className="w-72 bg-deep border-r border-white/10 p-4 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-foam font-semibold">Chattar</h2>
              <button onClick={() => setSidebarOpen(false)}>
                <X size={18} className="text-mist" />
              </button>
            </div>

            <button
              onClick={startNewConversation}
              className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg border border-sonar/30 text-sonar hover:bg-sonar/10"
            >
              <Plus size={16} /> Ny chatt
            </button>

            <div className="flex-1 overflow-y-auto space-y-1">
              {conversations.map((c) => (
                <button
                  key={c.id}
                  onClick={() => loadMessages(c.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm truncate ${
                    activeConversationId === c.id
                      ? "bg-sonar/20 text-sonar"
                      : "text-mist hover:bg-white/5"
                  }`}
                >
                  {c.title}
                </button>
              ))}
              {conversations.length === 0 && (
                <p className="text-mist/50 text-sm px-3">Inga tidigare chattar</p>
              )}
            </div>
          </div>
          <div
            className="flex-1 bg-black/40"
            onClick={() => setSidebarOpen(false)}
          />
        </div>
      )}

      {/* Huvudinnehåll */}
      <div className="flex-1 p-4 pb-24 space-y-4">
        <div className="flex items-center justify-between">
          <button onClick={() => setSidebarOpen(true)}>
            <Menu size={22} className="text-mist" />
          </button>
          <h1 className="text-2xl font-bold text-mist">MARIVIO AI</h1>
          <div className="w-[22px]" />
        </div>

        {/* Resestatus */}
        {tripActive && (
          <div className="rounded-xl border border-sonar/30 bg-deep/50 p-4 backdrop-blur">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-mist">Resa pågår</span>
              <button
                onClick={stopTrip}
                className="flex items-center gap-1 text-red-400"
              >
                <Square size={14} /> Avsluta
              </button>
            </div>
            <div className="flex gap-6 font-mono text-sonar">
              <span>{currentSpeedKn.toFixed(1)} kn</span>
              <span>{totalDistanceNm.toFixed(2)} nm</span>
            </div>
          </div>
        )}

        {!tripActive && (
          <button
            onClick={startTrip}
            className="w-full btn-primary !py-3 flex items-center justify-center gap-2"
          >
            <Play size={16} /> Starta resa
          </button>
        )}

        {/* Chattmeddelanden */}
        <div className="space-y-3 max-h-[50vh] overflow-y-auto">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`rounded-xl px-4 py-2 max-w-[85%] ${
                m.role === "user"
                  ? "bg-sonar/20 text-foam ml-auto"
                  : "bg-white/5 text-mist"
              }`}
            >
              {m.content}
            </div>
          ))}
          {loading && <p className="text-mist/50 text-sm">Tänker...</p>}
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") sendMessage(input);
            }}
            placeholder="Fråga något, eller säg 'starta resa'..."
            className="flex-1 bg-white/5 border border-sonar/20 rounded-full px-4 py-3 text-mist"
          />
          <button
            onClick={toggleListening}
            className={`p-3 rounded-full ${
              listening ? "bg-red-500/30" : "bg-sonar/25"
            }`}
          >
            {listening ? <MicOff size={18} /> : <Mic size={18} />}
          </button>
          <button
            onClick={() => sendMessage(input)}
            className="p-3 bg-sonar/25 rounded-full"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
