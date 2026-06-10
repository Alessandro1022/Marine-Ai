"use client";

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="mb-5 flex items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-2xl font-semibold glow-text">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-mist">{subtitle}</p> : null}
      </div>
      {action}
    </header>
  );
}
EOF
cat > src/components/ui/EmptyState.tsx << 'EOF'
"use client";

import { Waves } from "lucide-react";

export function EmptyState({ text, action }: { text: string; action?: React.ReactNode }) {
  return (
    <div className="glass-card flex flex-col items-center gap-3 p-8 text-center">
      <Waves size={28} className="text-sonar/60" strokeWidth={1.5} />
      <p className="text-sm text-mist">{text}</p>
      {action}
    </div>
  );
}
EOF
cat > src/components/ui/LoadingScreen.tsx << 'EOF'
"use client";

export function LoadingScreen() {
  return (
    <div className="flex min-h-[40dvh] items-center justify-center">
      <div className="radar h-20 w-20" aria-label="Loading" />
    </div>
  );
}
EOF
cat > src/components/nav/BottomTabBar.tsx << 'EOF'
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Map, Bot, BookOpen, User } from "lucide-react";
import { useT } from "@/lib/i18n";

const TABS = [
  { href: "/dashboard", icon: Home, key: "nav.home" },
  { href: "/map", icon: Map, key: "nav.map" },
  { href: "/ai", icon: Bot, key: "nav.ai" },
  { href: "/logbook", icon: BookOpen, key: "nav.logbook" },
  { href: "/profile", icon: User, key: "nav.profile" },
] as const;

export function BottomTabBar() {
  const pathname = usePathname();
  const t = useT();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-deep/80 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-md justify-around">
        {TABS.map(({ href, icon: Icon, key }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-1 px-3 py-2.5 text-[0.6rem] uppercase tracking-wider transition-colors ${
                active ? "text-sonar" : "text-mist"
              }`}
            >
              <span className={active ? "drop-shadow-[0_0_8px_rgba(45,224,190,0.8)]" : ""}>
                <Icon size={21} strokeWidth={active ? 2 : 1.6} />
              </span>
              {t(key)}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
EOF
cat > src/components/cards/WeatherCard.tsx << 'EOF'
"use client";

import type { WeatherSnapshot } from "@/types";
import { windDirectionLabel } from "@/lib/services/weatherService";
import { useT } from "@/lib/i18n";

const RISK_CLASS = {
  green: { dot: "risk-dot-green", text: "text-risk-green", key: "home.riskGreen" },
  yellow: { dot: "risk-dot-yellow", text: "text-risk-yellow", key: "home.riskYellow" },
  red: { dot: "risk-dot-red", text: "text-risk-red", key: "home.riskRed" },
} as const;

export function WeatherCard({ weather }: { weather: WeatherSnapshot }) {
  const t = useT();
  const risk = RISK_CLASS[weather.risk];

  return (
    <section className="holo-panel p-5">
      <div className="flex items-center justify-between">
        <span className="instrument-label">{t("home.currentWeather")}</span>
        <span className="flex items-center gap-2">
          <span className={risk.dot} />
          <span className={`instrument-label ${risk.text}`}>{t(risk.key)}</span>
        </span>
      </div>
      <div className="mt-4 grid grid-cols-4 gap-3">
        <Readout
          value={weather.wind_speed_ms.toFixed(1)}
          label={`${t("home.wind")} m/s ${windDirectionLabel(weather.wind_direction_deg)}`}
        />
        <Readout
          value={weather.wave_height_m !== null ? weather.wave_height_m.toFixed(1) : "–"}
          label={`${t("home.waves")} m`}
        />
        <Readout value={`${Math.round(weather.temperature_c)}°`} label={t("home.temperature")} />
        <Readout
          value={
            weather.visibility_m !== null
              ? `${Math.round(weather.visibility_m / 1000)}`
              : "–"
          }
          label={`${t("home.visibility")} km`}
        />
      </div>
    </section>
  );
}

function Readout({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="instrument text-xl">{value}</p>
      <p className="instrument-label mt-1 leading-tight">{label}</p>
    </div>
  );
}
EOF
cat > src/components/ai/AIChatBubble.tsx << 'EOF'
"use client";

import { Bot } from "lucide-react";

export function AIChatBubble({
  role,
  content,
}: {
  role: "user" | "assistant";
  content: string;
}) {
  if (role === "user") {
    return (
      <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-sonar/15 border border-sonar/25 px-4 py-2.5 text-sm whitespace-pre-wrap">
        {content}
      </div>
    );
  }
  return (
    <div className="flex max-w-[92%] gap-2.5">
      <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sonar/10 text-sonar">
        <Bot size={15} strokeWidth={1.75} />
      </span>
      <div className="glass-card rounded-2xl rounded-tl-md px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap">
        {content || "…"}
      </div>
    </div>
  );
}
