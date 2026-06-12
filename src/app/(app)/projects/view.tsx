"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { createProject } from "@/app/actions";
import type { Project } from "@/lib/types";
import { Button, Card, Field, Input, Select, Modal, EmptyState, Badge } from "@/components/ui";
import { formatSEK } from "@/lib/utils";

const STATUS_TONE = { planned: "blue", active: "green", completed: "neutral" } as const;

export default function ProjectsView({ projects, canCreate, canFinance }: {
  projects: Project[]; canCreate: boolean; canFinance: boolean;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [form, setForm] = useState({ name: "", customer: "", address: "", start_date: "", end_date: "", budget: 0, status: "planned" });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl sm:text-2xl font-semibold">{t("projects_title")}</h1>
        {canCreate && <Button onClick={() => setOpen(true)}>+ {t("new_project")}</Button>}
      </div>

      {projects.length === 0 ? (
        <Card><EmptyState icon="▣" text={t("no_projects")} /></Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((p) => (
            <Link key={p.id} href={`/projects/${p.id}`}>
              <Card className="p-4 h-full hover:border-gold-500/40 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium">{p.name}</p>
                  <Badge tone={STATUS_TONE[p.status]}>{t(("status_" + p.status) as never)}</Badge>
                </div>
                <div className="mt-2 space-y-0.5 text-xs text-ink-600 dark:text-white/40">
                  {p.customer && <p>{p.customer}</p>}
                  {p.address && <p>{p.address}</p>}
                  {canFinance && p.budget > 0 && <p className="text-gold-600 dark:text-gold-400 font-medium">{formatSEK(p.budget)}</p>}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={t("new_project")}>
        <div className="space-y-3">
          <Field label={t("project_name")}>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label={t("customer")}>
            <Input value={form.customer} onChange={(e) => setForm({ ...form, customer: e.target.value })} />
          </Field>
          <Field label={t("address")}>
            <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("start_date")}>
              <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
            </Field>
            <Field label={t("end_date")}>
              <Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("budget") + " (kr)"}>
              <Input type="number" inputMode="numeric" min={0} value={form.budget || ""} onChange={(e) => setForm({ ...form, budget: Number(e.target.value) })} />
            </Field>
            <Field label={t("status")}>
              <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="planned">{t("status_planned")}</option>
                <option value="active">{t("status_active")}</option>
                <option value="completed">{t("status_completed")}</option>
              </Select>
            </Field>
          </div>
          <Button
            className="w-full" size="lg" disabled={pending || !form.name}
            onClick={() => start(async () => { await createProject(form); setOpen(false); })}
          >
            {pending ? t("loading") : t("create")}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
