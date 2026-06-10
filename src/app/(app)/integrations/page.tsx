"use client";

import { useEffect, useRef, useState } from "react";
import { Cable, Radio, Wifi } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { SignalKClient, INTEGRATION_PROVIDERS, type Telemetry } from "@/lib/services/signalk";
import { useT } from "@/lib/i18n";

type Status = "idle" | "connecting" | "open" | "closed" | "error";

export default function IntegrationsPage() {
  const t = useT();
  const [host, setHost] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [telemetry, setTelemetry] = useState<Telemetry | null>(null);
  const clientRef = useRef<SignalKClient | null>(null);

  useEffect(() => {
    clientRef.current = new SignalKClient();
    return () => clientRef.current?.disconnect();
  }, []);

  function connect() {
    if (!host) return;
    clientRef.current?.connect(host, setTelemetry, (s) => setStatus(s));
  }

  const statusColor =
    status === "open" ? "text-risk-green" : status === "connecting" ? "text-risk-yellow" : "text-mist";

  return (
    <div>
      <PageHeader title={t("integrations.title")} subtitle={t("integrations.subtitle")} />

      {/* Connect to gateway */}
      <section className="holo-panel p-4">
        <div className="flex items-center gap-2">
          <Wifi size={15} className="text-sonar" />
          <span className="instrument-label">{t("integrations.gateway")}</span>
          <span className={`instrument-label ml-auto ${statusColor}`}>
            {t(`integrations.status_${status}`)}
          </span>
        </div>
        <div className="mt-3 flex gap-2">
          <input
            className="input-field flex-1"
            placeholder="192.168.4.1:3000"
            value={host}
            onChange={(e) => setHost(e.target.value)}
          />
          <button className="btn-primary !px-4" onClick={connect} disabled={!host}>
            <Cable size={16} />
          </button>
        </div>
        <p className="mt-2.5 text-[0.7rem] leading-relaxed text-mist/80">
          {t("integrations.note")}
        </p>
      </section>

      {/* Live telemetry */}
      {telemetry ? (
        <section className="holo-panel mt-4 p-5">
          <div className="flex items-center gap-2">
            <Radio size={15} className="animate-pulse text-sonar" />
            <span className="instrument-label">{t("integrations.liveTelemetry")}</span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <Readout value={fmt(telemetry.speedOverGroundKn, 1)} label="SOG kn" />
            <Readout value={fmt(telemetry.courseOverGroundDeg, 0, "°")} label="COG" />
            <Readout value={fmt(telemetry.depthM, 1, " m")} label={t("integrations.depth")} />
            <Readout value={fmt(telemetry.windSpeedApparentMs, 1, " m/s")} label={t("integrations.windApparent")} />
          </div>
        </section>
      ) : null}

      {/* Supported ecosystems */}
      <span className="instrument-label mt-5 block">{t("integrations.supported")}</span>
      <div className="mt-2 flex flex-col gap-2">
        {INTEGRATION_PROVIDERS.map((p) => (
          <div key={p.id} className="glass-card flex items-center justify-between p-3.5">
            <span className="font-display text-sm font-semibold">{p.name}</span>
            <span className="text-[0.68rem] text-mist">{p.note}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function fmt(v: number | null, decimals: number, suffix = "") {
  return v === null ? "–" : `${v.toFixed(decimals)}${suffix}`;
}

function Readout({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="instrument text-2xl text-sonar glow-text">{value}</p>
      <p className="instrument-label mt-1">{label}</p>
    </div>
  );
}
EOF
# ---- Profile ----
cat > "src/app/(app)/profile/page.tsx" << 'EOF'
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Ship, Globe, CreditCard, KeyRound, LogOut, Trash2, ChevronRight, Cable, ShieldAlert,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { useAuthStore } from "@/stores/authStore";
import { useI18n } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";

export default function ProfilePage() {
  const { t, locale, setLocale } = useI18n();
  const router = useRouter();
  const { profile, signOut } = useAuthStore();

  async function handleSignOut() {
    await signOut();
    router.push("/");
  }

  async function handleDelete() {
    if (!window.confirm(t("profile.deleteConfirm"))) return;
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      // Removes all user data via ON DELETE CASCADE once the auth user is deleted.
      await supabase.from("profiles").delete().eq("id", user.id);
      await signOut();
      router.push("/");
    }
  }

  return (
    <div>
      <PageHeader title={t("profile.title")} />

      {/* Profile header */}
      <section className="holo-panel flex items-center gap-4 p-5">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-sonar/10 font-display text-xl font-semibold text-sonar">
          {profile?.first_name?.[0] ?? "?"}
        </span>
        <div>
          <p className="font-display text-lg font-semibold">
            {profile ? `${profile.first_name} ${profile.last_name}` : "—"}
          </p>
          <p className="text-xs text-mist">{profile?.email}</p>
          <p className="instrument-label mt-1 text-sonar">
            {t(`plans.${profile?.subscription_plan ?? "free"}`)}
          </p>
        </div>
      </section>

      {/* Language */}
      <section className="glass-card mt-4 p-4">
        <div className="flex items-center gap-3">
          <Globe size={18} className="text-sonar" />
          <span className="flex-1 text-sm">{t("profile.language")}</span>
          <div className="flex gap-2">
            {(["sv", "en"] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLocale(l)}
                className={`rounded-full px-3 py-1 text-xs uppercase ${
                  locale === l ? "bg-sonar text-abyss font-semibold" : "border border-white/15 text-mist"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Links */}
      <div className="mt-4 flex flex-col gap-2">
        <Row href="/boats" icon={Ship} label={t("profile.boats")} />
        <Row href="/subscription" icon={CreditCard} label={t("profile.subscription")} />
        <Row href="/integrations" icon={Cable} label={t("integrations.title")} />
        <Row href="/safety" icon={ShieldAlert} label={t("safety.title")} />
        <Row href="/forgot-password" icon={KeyRound} label={t("profile.changePassword")} />
      </div>

      <div className="mt-6 flex flex-col gap-2">
        <button onClick={handleSignOut} className="btn-ghost">
          <LogOut size={16} /> {t("auth.logout")}
        </button>
        <button onClick={handleDelete} className="flex items-center justify-center gap-2 py-3 text-sm text-risk-red/80">
          <Trash2 size={15} /> {t("profile.deleteAccount")}
        </button>
      </div>

      <p className="mt-6 text-center text-xs text-mist/60">{t("app.copyright")}</p>
    </div>
  );
}

function Row({ href, icon: Icon, label }: { href: string; icon: typeof Ship; label: string }) {
  return (
    <Link href={href} className="glass-card flex items-center gap-3 p-4">
      <Icon size={18} className="text-sonar" />
      <span className="flex-1 text-sm">{label}</span>
      <ChevronRight size={16} className="text-mist" />
    </Link>
  );
}
EOF
# ---- Subscription ----
cat > "src/app/(app)/subscription/page.tsx" << 'EOF'
"use client";

import { Check } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { useAuthStore } from "@/stores/authStore";
import { createClient } from "@/lib/supabase/client";
import { useT } from "@/lib/i18n";
import type { SubscriptionPlan } from "@/types";

const PLANS: { id: SubscriptionPlan; key: string; descKey: string; price: string }[] = [
  { id: "free", key: "plans.free", descKey: "plans.freeDesc", price: "0 kr" },
  { id: "pro", key: "plans.pro", descKey: "plans.proDesc", price: "79 kr/mån" },
  { id: "premium", key: "plans.premium", descKey: "plans.premiumDesc", price: "149 kr/mån" },
];

export default function SubscriptionPage() {
  const t = useT();
  const { profile, refreshProfile } = useAuthStore();

  async function choose(plan: SubscriptionPlan) {
    // Payment processing (RevenueCat / Stripe) is wired in the native release.
    // For now this switches the plan directly.
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("profiles").update({ subscription_plan: plan }).eq("id", user.id);
    await refreshProfile();
  }

  return (
    <div>
      <PageHeader title={t("profile.subscription")} />
      <div className="flex flex-col gap-3">
        {PLANS.map((p) => {
          const current = profile?.subscription_plan === p.id;
          return (
            <div key={p.id} className={p.id === "premium" ? "holo-panel p-5" : "glass-card p-5"}>
              <div className="flex items-center justify-between">
                <span className="font-display text-lg font-semibold">{t(p.key)}</span>
                <span className="instrument text-sonar">{p.price}</span>
              </div>
              <p className="mt-1.5 text-xs text-mist">{t(p.descKey)}</p>
              <button
                className={current ? "btn-ghost mt-4 w-full" : "btn-primary mt-4 w-full"}
                onClick={() => choose(p.id)}
                disabled={current}
              >
                {current ? (
                  <>
                    <Check size={15} /> {t("plans.current")}
                  </>
                ) : (
                  t("plans.upgrade")
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
