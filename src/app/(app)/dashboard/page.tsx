
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Fuel, Wrench, Route, Calculator, ShieldAlert, Cable, Sparkles, ChevronRight,
} from "lucide-react";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useWeather } from "@/hooks/useWeather";
import { WeatherCard } from "@/components/cards/WeatherCard";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { useAuthStore } from "@/stores/authStore";
import { useBoatStore } from "@/stores/boatStore";
import { useI18n } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";
import { streamChat } from "@/lib/ai/client";
import type { MaintenanceItem, Trip } from "@/types";

export default function DashboardPage() {
  const { t, locale } = useI18n();
  const profile = useAuthStore((s) => s.profile);
  const primaryBoat = useBoatStore((s) => s.primaryBoat());
  const { lat, lon } = useGeolocation();
  const { data: weather, isLoading } = useWeather(lat, lon);

  const [maintenance, setMaintenance] = useState<MaintenanceItem[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [aiTip, setAiTip] = useState("");

  useEffect(() => {
    const supabase = createClient();
    void supabase
      .from("maintenance")
      .select("*")
      .is("completed_at", null)
      .order("due_date", { ascending: true })
      .limit(2)
      .then(({ data }) => setMaintenance((data as MaintenanceItem[]) ?? []));
    void supabase
      .from("trips")
      .select("*")
      .order("trip_date", { ascending: false })
      .limit(2)
      .then(({ data }) => setTrips((data as Trip[]) ?? []));
  }, []);

  // AI recommendation based on live conditions
  useEffect(() => {
    if (!weather || aiTip) return;
    const context = `Weather now: wind ${weather.wind_speed_ms} m/s, waves ${weather.wave_height_m ?? "?"} m, temp ${weather.temperature_c}°C, visibility ${weather.visibility_m ?? "?"} m, risk: ${weather.risk}. Boat: ${primaryBoat ? `${primaryBoat.boat_type}, cruise ${primaryBoat.cruise_speed_knots ?? "?"} kn` : "unknown"}.`;
    let text = "";
    streamChat({
      messages: [
        {
          role: "user",
          content:
            "Give one short, practical recommendation (max 2 sentences) for my boating today based on the context.",
        },
      ],
      locale,
      context,
      onChunk: (c) => {
        text += c;
        setAiTip(text);
      },
    }).catch(() => setAiTip(""));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weather]);

  const fuelPercent = primaryBoat?.fuel_level_percent ?? null;

  return (
    <div className="flex flex-col gap-4">
      {/* Header with radar */}
      <header className="flex items-center justify-between">
        <div>
          <p className="instrument-label">Empire Marine AI</p>
          <h1 className="mt-1 font-display text-2xl font-semibold glow-text">
            {profile ? `${t("home.greeting")}, ${profile.first_name}` : t("home.greeting")}
          </h1>
        </div>
        <div className="radar h-16 w-16" />
      </header>

      {isLoading || !weather ? <LoadingScreen /> : <WeatherCard weather={weather} />}

      {/* AI recommendation */}
      <section className="holo-panel p-4">
        <div className="flex items-center gap-2">
          <Sparkles size={15} className="text-sonar" />
          <span className="instrument-label">{t("home.aiRecommendations")}</span>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-foam/90 whitespace-pre-wrap">
          {aiTip || t("ai.thinking")}
        </p>
      </section>

      {/* Boat + fuel status */}
      {primaryBoat ? (
        <section className="glass-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="instrument-label">{t("home.boatStatus")}</span>
              <p className="mt-1 font-display font-semibold">{primaryBoat.name}</p>
              <p className="text-xs text-mist">
                {primaryBoat.manufacturer} {primaryBoat.model}{" "}
                {primaryBoat.year ? `· ${primaryBoat.year}` : ""}
              </p>
            </div>
            {fuelPercent !== null ? (
              <div className="text-right">
                <span className="instrument-label">{t("home.fuelStatus")}</span>
                <p className={`instrument text-2xl ${fuelPercent < 25 ? "text-risk-red" : "text-sonar"}`}>
                  {Math.round(fuelPercent)}%
                </p>
              </div>
            ) : null}
          </div>
          {fuelPercent !== null ? (
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className={`h-full rounded-full ${fuelPercent < 25 ? "bg-risk-red" : "bg-sonar"} shadow-sonar`}
                style={{ width: `${fuelPercent}%` }}
              />
            </div>
          ) : null}
        </section>
      ) : null}

      {/* Quick actions */}
      <section>
        <span className="instrument-label">{t("home.quickActions")}</span>
        <div className="mt-2 grid grid-cols-4 gap-2.5">
          {[
            { href: "/route-planner", icon: Route, key: "route.title" },
            { href: "/fuel", icon: Calculator, key: "fuel.title" },
            { href: "/safety", icon: ShieldAlert, key: "safety.title" },
            { href: "/integrations", icon: Cable, key: "integrations.title" },
          ].map(({ href, icon: Icon, key }) => (
            <Link key={href} href={href} className="glass-card flex flex-col items-center gap-1.5 p-3">
              <Icon size={19} className="text-sonar" strokeWidth={1.7} />
              <span className="text-center text-[0.62rem] leading-tight text-mist">{t(key)}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Maintenance + trips */}
      {maintenance.length > 0 ? (
        <Link href="/maintenance" className="glass-card flex items-center gap-3 p-4">
          <Wrench size={18} className="shrink-0 text-risk-yellow" />
          <div className="min-w-0 flex-1">
            <span className="instrument-label">{t("home.upcomingMaintenance")}</span>
            <p className="truncate text-sm">{maintenance[0].title}</p>
          </div>
          <ChevronRight size={16} className="text-mist" />
        </Link>
      ) : null}

      {trips.length > 0 ? (
        <Link href="/logbook" className="glass-card flex items-center gap-3 p-4">
          <Fuel size={18} className="shrink-0 text-sonar" />
          <div className="min-w-0 flex-1">
            <span className="instrument-label">{t("home.recentTrips")}</span>
            <p className="truncate text-sm">
              {trips[0].start_location} → {trips[0].destination}
            </p>
          </div>
          <ChevronRight size={16} className="text-mist" />
        </Link>
      ) : null}
    </div>
  );
}
EOF
# ---- AI chat ----
cat > "src/app/(app)/ai/page.tsx" << 'EOF'
"use client";

import { useEffect, useRef, useState } from "react";
import { SendHorizonal } from "lucide-react";
import { AIChatBubble } from "@/components/ai/AIChatBubble";
import { PageHeader } from "@/components/ui/PageHeader";
import { useI18n } from "@/lib/i18n";
import { streamChat, type ChatMsg } from "@/lib/ai/client";
import { createClient } from "@/lib/supabase/client";
import { useBoatStore } from "@/stores/boatStore";

export default function AIPage() {
  const { t, locale } = useI18n();
  const primaryBoat = useBoatStore((s) => s.primaryBoat());
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    void supabase
      .from("chat_messages")
      .select("role, content")
      .order("created_at")
      .limit(50)
      .then(({ data }) => {
        if (data?.length) setMessages(data as ChatMsg[]);
      });
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || busy) return;
    setInput("");
    setBusy(true);

    const next: ChatMsg[] = [...messages, { role: "user", content }];
    setMessages([...next, { role: "assistant", content: "" }]);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      void supabase.from("chat_messages").insert({ user_id: user.id, role: "user", content });
    }

    const context = primaryBoat
      ? `User's boat: ${primaryBoat.name}, type ${primaryBoat.boat_type}, cruise ${primaryBoat.cruise_speed_knots ?? "?"} kn, fuel capacity ${primaryBoat.fuel_capacity_liters ?? "?"} L.`
      : undefined;

    let full = "";
    try {
      full = await streamChat({
        messages: next,
        locale,
        context,
        onChunk: () => {
          setMessages((m) => {
            const copy = [...m];
            copy[copy.length - 1] = { role: "assistant", content: (full += "") || copy[copy.length - 1].content };
            return copy;
          });
        },
      });
    } catch {
      full = t("common.error");
    }
    setMessages((m) => {
      const copy = [...m];
      copy[copy.length - 1] = { role: "assistant", content: full };
      return copy;
    });
    if (user && full) {
      void supabase.from("chat_messages").insert({ user_id: user.id, role: "assistant", content: full });
    }
    setBusy(false);
  }

  const suggestions = [t("ai.suggested1"), t("ai.suggested2"), t("ai.suggested3"), t("ai.suggested4")];

  return (
    <div className="flex min-h-[calc(100dvh-9rem)] flex-col">
      <PageHeader title={t("ai.title")} />

      <div className="flex flex-1 flex-col gap-3">
        {messages.length === 0 ? (
          <div className="flex flex-col gap-2.5">
            {suggestions.map((s) => (
              <button key={s} onClick={() => send(s)} className="glass-card p-3.5 text-left text-sm text-mist">
                {s}
              </button>
            ))}
          </div>
        ) : (
          messages.map((m, i) => <AIChatBubble key={i} role={m.role} content={m.content} />)
        )}
        <div ref={bottomRef} />
      </div>

      <div className="sticky bottom-24 mt-4 flex gap-2">
        <input
          className="input-field flex-1"
          placeholder={t("ai.placeholder")}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send(input)}
        />
        <button
          className="btn-primary !px-4"
          onClick={() => send(input)}
          disabled={busy || !input.trim()}
          aria-label="Send"
        >
          <SendHorizonal size={18} />
        </button>
      </div>
    </div>
  );
}
