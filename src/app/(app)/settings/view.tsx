"use client";

import { useState, useTransition } from "react";
import { useI18n } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { updateCompanySettings } from "@/app/actions";
import type { Company } from "@/lib/types";
import { Button, Card, Field, Input, Select, Badge, Eyebrow } from "@/components/ui";
import { MODULES } from "@/lib/modules";

export default function SettingsView({ company, canManage }: { company: Company | null; canManage: boolean }) {
  const { t, lang, setLang } = useI18n();
  const { theme, setTheme } = useTheme();
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    name: company?.name ?? "",
    default_hourly_cost: company?.default_hourly_cost ?? 450,
    default_billing_rate: company?.default_billing_rate ?? 750,
  });

  return (
    <div className="space-y-5 max-w-xl">
      <h1 className="font-display text-xl sm:text-2xl font-semibold">{t("settings_title")}</h1>

      <Card className="p-5 space-y-4">
        <h2 className="font-display font-semibold">{t("language")} & {t("theme")}</h2>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t("language")}>
            <Select value={lang} onChange={(e) => setLang(e.target.value as "sv" | "en")}>
              <option value="sv">Svenska</option>
              <option value="en">English</option>
            </Select>
          </Field>
          <Field label={t("theme")}>
            <Select value={theme} onChange={(e) => setTheme(e.target.value as "dark" | "light")}>
              <option value="dark">{t("theme_dark")}</option>
              <option value="light">{t("theme_light")}</option>
            </Select>
          </Field>
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="font-display font-semibold">{t("modules_title" as never)}</h2>
        <p className="mt-1 mb-4 text-xs text-ink-600 dark:text-white/40">{t("modules_subtitle" as never)}</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {MODULES.map((m) => (
            <div key={m.id} className="bp-card rounded-lg border border-dashed border-black/15 dark:border-white/12 p-3 opacity-80 hover:opacity-100 transition-opacity">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">{m.icon} {t(m.nameKey as never)}</p>
                <Badge tone={m.ai ? "gold" : "blue"}>{t("mod_coming" as never)}</Badge>
              </div>
              <p className="mt-1 text-xs text-ink-600 dark:text-white/40">{t(m.descKey as never)}</p>
            </div>
          ))}
        </div>
      </Card>

      {canManage && company && (
        <Card className="p-5 space-y-4">
          <h2 className="font-display font-semibold">{t("company_settings")}</h2>
          <Field label={t("company_name")}>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("hourly_cost")}>
              <Input type="number" inputMode="numeric" value={form.default_hourly_cost}
                onChange={(e) => setForm({ ...form, default_hourly_cost: Number(e.target.value) })} />
            </Field>
            <Field label={t("billing_rate")}>
              <Input type="number" inputMode="numeric" value={form.default_billing_rate}
                onChange={(e) => setForm({ ...form, default_billing_rate: Number(e.target.value) })} />
            </Field>
          </div>
          <Button
            disabled={pending}
            onClick={() => start(async () => { await updateCompanySettings(form); setSaved(true); setTimeout(() => setSaved(false), 2000); })}
          >
            {pending ? t("loading") : saved ? "✓ " + t("saved") : t("save")}
          </Button>
        </Card>
      )}
    </div>
  );
}
