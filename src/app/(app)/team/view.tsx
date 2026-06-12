"use client";

import { useState, useTransition } from "react";
import { useI18n } from "@/lib/i18n";
import { createTeamMember, setUserStatus, changeUserRole } from "@/app/actions";
import type { Profile, Role } from "@/lib/types";
import { Button, Card, Field, Input, Select, Modal, Badge } from "@/components/ui";

const ROLE_TONE: Record<Role, "gold" | "blue" | "green" | "neutral" | "amber"> = {
  beyer_bey: "gold", admin: "blue", economy: "green", worker: "neutral", intern: "amber",
};

export default function TeamView({ team, myRole, roles, canChangeRole }: {
  team: Profile[]; myRole: Role; roles: Role[]; canChangeRole: boolean;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const [form, setForm] = useState({ full_name: "", email: "", password: "", role: (roles[0] ?? "worker") as Role });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl sm:text-2xl font-semibold">{t("team_title")}</h1>
        {roles.length > 0 && <Button onClick={() => setOpen(true)}>+ {t("invite_user")}</Button>}
      </div>

      <div className="space-y-2">
        {team.map((u) => (
          <Card key={u.id} className="p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium">{u.full_name}</p>
              <p className="text-xs text-ink-600 dark:text-white/40">{u.email}</p>
            </div>
            <div className="flex items-center gap-2">
              {canChangeRole && u.role !== "beyer_bey" ? (
                <Select
                  value={u.role} disabled={pending} className="w-auto text-xs py-1.5"
                  onChange={(e) => start(() => changeUserRole(u.id, e.target.value as Role))}
                >
                  {(["admin", "economy", "worker", "intern"] as Role[]).map((r) => (
                    <option key={r} value={r}>{t(("role_" + r) as never)}</option>
                  ))}
                </Select>
              ) : (
                <Badge tone={ROLE_TONE[u.role]}>{t(("role_" + u.role) as never)}</Badge>
              )}
              {u.status === "suspended" && <Badge tone="red">⏸</Badge>}
              {u.role !== "beyer_bey" && (myRole === "beyer_bey" || ["worker", "intern"].includes(u.role)) && (
                <Button
                  size="sm" variant={u.status === "active" ? "outline" : "primary"} disabled={pending}
                  onClick={() => start(() => setUserStatus(u.id, u.status === "active" ? "suspended" : "active"))}
                >
                  {u.status === "active" ? t("suspend") : t("activate")}
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={t("invite_user")}>
        <div className="space-y-3">
          <Field label={t("full_name")}>
            <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          </Field>
          <Field label={t("email")}>
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
          <Field label={t("temp_password")}>
            <Input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </Field>
          <Field label={t("role")}>
            <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })}>
              {roles.map((r) => <option key={r} value={r}>{t(("role_" + r) as never)}</option>)}
            </Select>
          </Field>
          {error && <p className="text-sm text-signal-red">{error}</p>}
          <Button
            className="w-full" size="lg"
            disabled={pending || !form.full_name || !form.email || form.password.length < 6}
            onClick={() =>
              start(async () => {
                try { await createTeamMember(form); setOpen(false); setError(""); }
                catch (e) { setError(e instanceof Error ? e.message : "Error"); }
              })
            }
          >
            {pending ? t("loading") : t("create")}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
