"use client";

import { useState } from "react";
import { Plus, CheckCircle2, Wrench } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { createClient } from "@/lib/supabase/client";
import { useT } from "@/lib/i18n";
import type { MaintenanceItem, MaintenanceType } from "@/types";

const TYPES: { id: MaintenanceType; key: string }[] = [
  { id: "oil_change", key: "maintenance.oilChange" },
  { id: "engine_service", key: "maintenance.engineService" },
  { id: "battery_replacement", key: "maintenance.batteryReplacement" },
  { id: "impeller_replacement", key: "maintenance.impellerReplacement" },
  { id: "hull_cleaning", key: "maintenance.hullCleaning" },
  { id: "winter_storage", key: "maintenance.winterStorage" },
];

export default function MaintenancePage() {
  const t = useT();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState<MaintenanceType>("oil_change");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");

  const { data: items } = useQuery({
    queryKey: ["maintenance"],
    queryFn: async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("maintenance")
        .select("*")
        .order("completed_at", { ascending: true, nullsFirst: true })
        .order("due_date", { ascending: true });
      return (data as MaintenanceItem[]) ?? [];
    },
  });

  async function save() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const typeDef = TYPES.find((x) => x.id === type)!;
    await supabase.from("maintenance").insert({
      user_id: user.id,
      maintenance_type: type,
      title: t(typeDef.key),
      due_date: dueDate || null,
      notes: notes || null,
    });
    setShowForm(false);
    setDueDate("");
    setNotes("");
    void queryClient.invalidateQueries({ queryKey: ["maintenance"] });
  }

  async function complete(id: string) {
    const supabase = createClient();
    await supabase.from("maintenance").update({ completed_at: new Date().toISOString() }).eq("id", id);
    void queryClient.invalidateQueries({ queryKey: ["maintenance"] });
  }

  const open = (items ?? []).filter((i) => !i.completed_at);
  const done = (items ?? []).filter((i) => i.completed_at);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div>
      <PageHeader
        title={t("maintenance.title")}
        action={
          <button className="btn-primary !px-4 !py-2 text-xs" onClick={() => setShowForm(!showForm)}>
            <Plus size={14} /> {t("maintenance.addMaintenance")}
          </button>
        }
      />

      {showForm ? (
        <div className="holo-panel mb-4 flex flex-col gap-3 p-4">
          <select className="input-field" value={type} onChange={(e) => setType(e.target.value as MaintenanceType)}>
            {TYPES.map((x) => (
              <option key={x.id} value={x.id}>{t(x.key)}</option>
            ))}
          </select>
          <input className="input-field" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} aria-label={t("maintenance.dueDate")} />
          <input className="input-field" placeholder={t("boats.notes")} value={notes} onChange={(e) => setNotes(e.target.value)} />
          <button className="btn-primary" onClick={save}>{t("common.save")}</button>
        </div>
      ) : null}

      <div className="flex flex-col gap-3">
        {open.length === 0 ? <EmptyState text={t("common.empty")} /> : null}
        {open.map((i) => {
          const overdue = i.due_date && i.due_date < today;
          return (
            <div key={i.id} className="glass-card flex items-center gap-3 p-4">
              <Wrench size={18} className={overdue ? "text-risk-red" : "text-risk-yellow"} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{i.title}</p>
                <p className={`text-xs ${overdue ? "text-risk-red" : "text-mist"}`}>
                  {i.due_date ?? "—"} {overdue ? `· ${t("maintenance.overdue")}` : ""}
                </p>
              </div>
              <button onClick={() => complete(i.id)} aria-label={t("common.done")}>
                <CheckCircle2 size={20} className="text-mist hover:text-sonar" />
              </button>
            </div>
          );
        })}

        {done.length > 0 ? (
          <>
            <span className="instrument-label mt-2">{t("maintenance.history")}</span>
            {done.map((i) => (
              <div key={i.id} className="glass-card flex items-center gap-3 p-4 opacity-60">
                <CheckCircle2 size={18} className="text-sonar" />
                <div className="flex-1">
                  <p className="text-sm">{i.title}</p>
                  <p className="text-xs text-mist">{i.completed_at?.slice(0, 10)}</p>
                </div>
              </div>
            ))}
          </>
        ) : null}
      </div>
    </div>
  );
}
EOF
# ---- Safety center ----
cat > "src/app/(app)/safety/page.tsx" << 'EOF'
"use client";

import { useState } from "react";
import { ShieldAlert, Phone, CheckSquare, Square } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useWeather } from "@/hooks/useWeather";
import { useBoatStore } from "@/stores/boatStore";
import { useT } from "@/lib/i18n";

const CHECKLIST_KEYS = [
  "safety.check1",
  "safety.check2",
  "safety.check3",
  "safety.check4",
  "safety.check5",
  "safety.check6",
];

export default function SafetyPage() {
  const t = useT();
  const { lat, lon } = useGeolocation();
  const { data: weather } = useWeather(lat, lon);
  const boat = useBoatStore((s) => s.primaryBoat());
  const [checked, setChecked] = useState<Set<string>>(new Set());

  function toggle(key: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const warnings: { text: string; level: "yellow" | "red" }[] = [];
  if (weather?.risk === "red") warnings.push({ text: t("home.riskRed"), level: "red" });
  if (weather?.risk === "yellow") warnings.push({ text: t("home.riskYellow"), level: "yellow" });
  if (boat && boat.fuel_level_percent < 25)
    warnings.push({ text: t("safety.lowFuel"), level: "yellow" });

  return (
    <div>
      <PageHeader title={t("safety.title")} />

      {warnings.length > 0 ? (
        <div className="mb-4 flex flex-col gap-2.5">
          {warnings.map((w, i) => (
            <div
              key={i}
              className={`glass-card flex items-center gap-3 p-4 ${
                w.level === "red" ? "border-risk-red/50" : "border-risk-yellow/50"
              }`}
            >
              <ShieldAlert size={18} className={w.level === "red" ? "text-risk-red" : "text-risk-yellow"} />
              <p className="text-sm">{w.text}</p>
            </div>
          ))}
        </div>
      ) : null}

      {/* SOS */}
      <section className="holo-panel p-5">
        <span className="instrument-label">{t("safety.sos")}</span>
        <a href="tel:112" className="mt-3 flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-risk-red/15 text-risk-red animate-pulse-sonar">
            <Phone size={20} />
          </span>
          <div>
            <p className="instrument text-2xl text-risk-red">112</p>
            <p className="text-xs text-mist">{t("safety.sosNumber")}</p>
          </div>
        </a>
      </section>

      {/* Emergency checklist */}
      <section className="mt-4">
        <span className="instrument-label">{t("safety.emergencyChecklist")}</span>
        <div className="mt-2 flex flex-col gap-2">
          {CHECKLIST_KEYS.map((key) => (
            <button key={key} onClick={() => toggle(key)} className="glass-card flex items-center gap-3 p-3.5 text-left">
              {checked.has(key) ? (
                <CheckSquare size={18} className="shrink-0 text-sonar" />
              ) : (
                <Square size={18} className="shrink-0 text-mist" />
              )}
              <span className={`text-sm ${checked.has(key) ? "text-mist line-through" : ""}`}>{t(key)}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Contacts */}
      <section className="mt-4">
        <span className="instrument-label">{t("safety.emergencyContacts")}</span>
        <div className="mt-2 flex flex-col gap-2">
          <Contact name={t("safety.contactJrcc")} number="112" />
          <Contact name={t("safety.contactSsrs")} number="077-579 00 90" />
          <Contact name={t("safety.contactVhf")} number="VHF 16" />
        </div>
      </section>
    </div>
  );
}

function Contact({ name, number }: { name: string; number: string }) {
  return (
    <div className="glass-card flex items-center justify-between p-3.5">
      <span className="text-sm">{name}</span>
      <span className="instrument text-sm text-sonar">{number}</span>
    </div>
  );
}
