"use client";

import { useState, useTransition } from "react";
import { useI18n } from "@/lib/i18n";
import { createOrder, updateOrderStatus } from "@/app/actions";
import { Button, Card, Field, Input, Select, Textarea, Modal, EmptyState, Badge } from "@/components/ui";

interface OrderRow {
  id: string; title: string; description: string | null; status: string; priority: string;
  due_date: string | null;
  projects: { name: string } | null;
  profiles: { full_name: string } | null;
}

export default function OrdersView({ orders, projects, team, canCreate }: {
  orders: OrderRow[];
  projects: { id: string; name: string }[];
  team: { id: string; full_name: string }[];
  canCreate: boolean;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [form, setForm] = useState({ title: "", description: "", priority: "medium", assignee_id: "", project_id: "", due_date: "" });

  const cols: { status: string; key: "status_not_started" | "status_in_progress" | "status_done" }[] = [
    { status: "not_started", key: "status_not_started" },
    { status: "in_progress", key: "status_in_progress" },
    { status: "done", key: "status_done" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl sm:text-2xl font-semibold">{t("orders_title")}</h1>
        {canCreate && <Button onClick={() => setOpen(true)}>+ {t("new_order")}</Button>}
      </div>

      {orders.length === 0 ? (
        <Card><EmptyState icon="☰" text={t("no_orders")} /></Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {cols.map((col) => {
            const list = orders.filter((o) => o.status === col.status);
            return (
              <div key={col.status}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-600 dark:text-white/40">
                  {t(col.key)} · {list.length}
                </p>
                <div className="space-y-2">
                  {list.map((o) => (
                    <Card key={o.id} className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium">{o.title}</p>
                        <Badge tone={o.priority === "high" ? "red" : o.priority === "medium" ? "amber" : "neutral"}>
                          {t(("prio_" + o.priority) as never)}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-ink-600 dark:text-white/40">
                        {[o.projects?.name, o.profiles?.full_name, o.due_date].filter(Boolean).join(" · ")}
                      </p>
                      {o.description && <p className="mt-2 text-xs text-ink-700 dark:text-white/55">{o.description}</p>}
                      {o.status !== "done" && (
                        <Button
                          size="sm" variant="outline" className="mt-3 w-full" disabled={pending}
                          onClick={() => start(() => updateOrderStatus(o.id, o.status === "not_started" ? "in_progress" : "done"))}
                        >
                          {o.status === "not_started" ? t("mark_in_progress") : t("mark_done")}
                        </Button>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={t("new_order")}>
        <div className="space-y-3">
          <Field label={t("order_title")}>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </Field>
          <Field label={t("description")}>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("priority")}>
              <Select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                <option value="low">{t("prio_low")}</option>
                <option value="medium">{t("prio_medium")}</option>
                <option value="high">{t("prio_high")}</option>
              </Select>
            </Field>
            <Field label={t("due_date")}>
              <Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
            </Field>
          </div>
          <Field label={t("project")}>
            <Select value={form.project_id} onChange={(e) => setForm({ ...form, project_id: e.target.value })}>
              <option value="">—</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </Select>
          </Field>
          <Field label={t("assignee")}>
            <Select value={form.assignee_id} onChange={(e) => setForm({ ...form, assignee_id: e.target.value })}>
              <option value="">—</option>
              {team.map((u) => <option key={u.id} value={u.id}>{u.full_name}</option>)}
            </Select>
          </Field>
          <Button
            className="w-full" size="lg" disabled={pending || !form.title || !form.project_id}
            onClick={() => start(async () => { await createOrder(form); setOpen(false); })}
          >
            {pending ? t("loading") : t("create")}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
