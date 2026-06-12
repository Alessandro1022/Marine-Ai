"use client";

import { useState, useTransition } from "react";
import { useI18n } from "@/lib/i18n";
import { reportMaterial } from "@/app/actions";
import { Button, Card, Field, Input, Select, Textarea, Modal, EmptyState } from "@/components/ui";
import { formatSEK } from "@/lib/utils";

interface MatRow {
  id: string; name: string; quantity: number; unit_cost: number; comment: string | null;
  created_at: string; projects: { name: string } | null;
}

export default function MaterialsView({ materials, projects }: {
  materials: MatRow[]; projects: { id: string; name: string }[];
}) {
  const { t, lang } = useI18n();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [form, setForm] = useState({ project_id: "", name: "", quantity: 1, unit_cost: 0, comment: "" });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl sm:text-2xl font-semibold">{t("materials_title")}</h1>
        <Button onClick={() => setOpen(true)}>+ {t("new_material")}</Button>
      </div>

      {materials.length === 0 ? (
        <Card><EmptyState icon="▤" text={t("no_materials")} /></Card>
      ) : (
        <div className="space-y-2">
          {materials.map((m) => (
            <Card key={m.id} className="p-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium">{m.name} × {m.quantity}</p>
                <p className="text-xs text-ink-600 dark:text-white/40">
                  {m.projects?.name ?? "—"} · {new Date(m.created_at).toLocaleDateString(lang === "sv" ? "sv-SE" : "en-GB")}
                </p>
                {m.comment && <p className="text-xs text-ink-600 dark:text-white/40 truncate">{m.comment}</p>}
              </div>
              <p className="shrink-0 text-sm font-semibold tabular-nums text-gold-600 dark:text-gold-400">
                {formatSEK(m.quantity * m.unit_cost)}
              </p>
            </Card>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={t("new_material")}>
        <div className="space-y-3">
          <Field label={t("project")}>
            <Select value={form.project_id} onChange={(e) => setForm({ ...form, project_id: e.target.value })}>
              <option value="">{t("select_project")}</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </Select>
          </Field>
          <Field label={t("material_name")}>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("quantity")}>
              <Input type="number" inputMode="decimal" min={0} value={form.quantity || ""} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} />
            </Field>
            <Field label={t("unit_cost")}>
              <Input type="number" inputMode="decimal" min={0} value={form.unit_cost || ""} onChange={(e) => setForm({ ...form, unit_cost: Number(e.target.value) })} />
            </Field>
          </div>
          <Field label={t("comment")}>
            <Textarea value={form.comment} placeholder={t("comment_placeholder")} onChange={(e) => setForm({ ...form, comment: e.target.value })} />
          </Field>
          <p className="text-right text-sm text-ink-600 dark:text-white/40">
            {t("total")}: <span className="font-semibold text-gold-600 dark:text-gold-400">{formatSEK(form.quantity * form.unit_cost)}</span>
          </p>
          <Button
            className="w-full" size="lg" disabled={pending || !form.name || !form.project_id}
            onClick={() => start(async () => { await reportMaterial(form); setOpen(false); setForm({ project_id: "", name: "", quantity: 1, unit_cost: 0, comment: "" }); })}
          >
            {pending ? t("loading") : t("save")}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
