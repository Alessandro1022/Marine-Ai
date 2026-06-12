"use client";

import { useTransition } from "react";
import { useI18n } from "@/lib/i18n";
import { updateProjectStatus, addProjectMember, updateOrderStatus } from "@/app/actions";
import type { Project } from "@/lib/types";
import { Card, Badge, Select, ProgressBar, EmptyState, Button } from "@/components/ui";
import { formatSEK } from "@/lib/utils";

interface OrderRow {
  id: string; title: string; status: string; priority: string; due_date: string | null;
  profiles: { full_name: string } | null;
}

export default function ProjectDetailView({ project, orders, finance, canEdit, members, team }: {
  project: Project;
  orders: OrderRow[];
  finance: { laborHours: number; laborCost: number; materialCost: number; budget: number } | null;
  canEdit: boolean;
  members: { user_id: string; name: string }[];
  team: { id: string; full_name: string; role: string }[];
}) {
  const { t } = useI18n();
  const [pending, start] = useTransition();
  const spent = finance ? finance.laborCost + finance.materialCost : 0;
  const pct = finance && finance.budget > 0 ? (spent / finance.budget) * 100 : 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-semibold">{project.name}</h1>
          <p className="text-sm text-ink-600 dark:text-white/40">
            {[project.customer, project.address].filter(Boolean).join(" · ")}
          </p>
        </div>
        {canEdit ? (
          <Select
            value={project.status}
            disabled={pending}
            onChange={(e) => start(() => updateProjectStatus(project.id, e.target.value))}
            className="w-auto"
          >
            <option value="planned">{t("status_planned")}</option>
            <option value="active">{t("status_active")}</option>
            <option value="completed">{t("status_completed")}</option>
          </Select>
        ) : (
          <Badge tone="gold">{t(("status_" + project.status) as never)}</Badge>
        )}
      </div>

      {finance && (
        <Card className="p-5 space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display font-semibold">{t("budget_vs_actual")}</h2>
            <p className="text-sm tabular-nums">
              <span className={pct > 100 ? "text-signal-red font-semibold" : "text-gold-600 dark:text-gold-400 font-semibold"}>{formatSEK(spent)}</span>
              <span className="text-ink-600 dark:text-white/40"> / {formatSEK(finance.budget)}</span>
            </p>
          </div>
          <ProgressBar value={pct} />
          <div className="grid grid-cols-3 gap-3 text-center text-xs">
            <div><p className="text-ink-600 dark:text-white/40">{t("hours")}</p><p className="font-semibold tabular-nums">{finance.laborHours.toFixed(1)} h</p></div>
            <div><p className="text-ink-600 dark:text-white/40">{t("hours_per_project")}</p><p className="font-semibold tabular-nums">{formatSEK(finance.laborCost)}</p></div>
            <div><p className="text-ink-600 dark:text-white/40">{t("material_costs")}</p><p className="font-semibold tabular-nums">{formatSEK(finance.materialCost)}</p></div>
          </div>
        </Card>
      )}

      {/* Members */}
      <Card className="p-5">
        <h2 className="font-display font-semibold mb-3">{t("members")}</h2>
        <div className="flex flex-wrap gap-2">
          {members.map((m) => <Badge key={m.user_id} tone="neutral">{m.name}</Badge>)}
          {members.length === 0 && <p className="text-sm text-ink-600 dark:text-white/40">—</p>}
        </div>
        {canEdit && team.length > 0 && (
          <Select
            className="mt-3 max-w-xs"
            defaultValue=""
            disabled={pending}
            onChange={(e) => { if (e.target.value) start(() => addProjectMember(project.id, e.target.value)); }}
          >
            <option value="">+ {t("add_member")}</option>
            {team.filter((u) => !members.some((m) => m.user_id === u.id)).map((u) => (
              <option key={u.id} value={u.id}>{u.full_name}</option>
            ))}
          </Select>
        )}
      </Card>

      {/* Orders in project */}
      <div>
        <h2 className="font-display font-semibold mb-3">{t("orders_title")}</h2>
        {orders.length === 0 ? (
          <Card><EmptyState icon="☰" text={t("no_orders")} /></Card>
        ) : (
          <div className="space-y-2">
            {orders.map((o) => (
              <Card key={o.id} className="p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{o.title}</p>
                  <p className="text-xs text-ink-600 dark:text-white/40">
                    {o.profiles?.full_name ?? "—"}{o.due_date ? ` · ${o.due_date}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge tone={o.priority === "high" ? "red" : o.priority === "medium" ? "amber" : "neutral"}>
                    {t(("prio_" + o.priority) as never)}
                  </Badge>
                  {o.status !== "done" && (
                    <Button size="sm" variant="outline" disabled={pending}
                      onClick={() => start(() => updateOrderStatus(o.id, o.status === "not_started" ? "in_progress" : "done"))}>
                      {o.status === "not_started" ? t("mark_in_progress") : t("mark_done")}
                    </Button>
                  )}
                  {o.status === "done" && <Badge tone="green">{t("status_done")}</Badge>}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
