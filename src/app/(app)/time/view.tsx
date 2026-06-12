"use client";

import { useState, useTransition, useEffect } from "react";
import { useI18n } from "@/lib/i18n";
import { startWorkday, stopWorkday } from "@/app/actions";
import { Button, Card, Field, Input, Select, Textarea, Modal, EmptyState, Badge } from "@/components/ui";
import { entryMinutes, formatHours, cn } from "@/lib/utils";

interface Entry {
  id: string; started_at: string; ended_at: string | null;
  break_minutes: number; overtime_minutes: number; comment: string | null;
  project_id: string | null;
  projects?: { name: string } | null;
}

export default function TimeView({ openEntry, recent, projects }: {
  openEntry: Entry | null;
  recent: Entry[];
  projects: { id: string; name: string }[];
}) {
  const { t, lang } = useI18n();
  const [pending, start] = useTransition();
  const [projectId, setProjectId] = useState("");
  const [stopOpen, setStopOpen] = useState(false);
  const [breakMin, setBreakMin] = useState(0);
  const [overtimeMin, setOvertimeMin] = useState(0);
  const [comment, setComment] = useState("");
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(i);
  }, []);

  const liveMinutes = openEntry ? entryMinutes(openEntry.started_at, null, 0) : 0;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-xl sm:text-2xl font-semibold">{t("time_title")}</h1>

      {/* THE CLOCK — one tap in, one tap out */}
      <Card glow={!!openEntry} className="p-6 sm:p-8 flex flex-col items-center text-center">
        {openEntry ? (
          <>
            <Badge tone="green" className="mb-3">● {t("on_the_clock")}</Badge>
            <p className="font-display text-5xl font-semibold tabular-nums text-signal-green">
              {formatHours(liveMinutes)}
            </p>
            <p className="mt-1 text-sm text-ink-600 dark:text-white/40">
              {t("started")}{" "}
              {new Date(openEntry.started_at).toLocaleTimeString(lang === "sv" ? "sv-SE" : "en-GB", { hour: "2-digit", minute: "2-digit" })}
              {openEntry.projects?.name ? ` · ${openEntry.projects.name}` : ""}
            </p>
            <button
              onClick={() => setStopOpen(true)}
              className="mt-6 grid h-28 w-28 place-items-center rounded-full bg-signal-red text-white font-semibold shadow-card active:scale-95 transition-transform"
            >
              {t("stop_day")}
            </button>
          </>
        ) : (
          <>
            <Select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="mb-5 max-w-xs">
              <option value="">{t("select_project")}</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </Select>
            <button
              disabled={pending}
              onClick={() => start(() => startWorkday(projectId || null))}
              className={cn(
                "grid h-32 w-32 place-items-center rounded-full bg-signal-green text-ink-950 font-semibold text-base shadow-card",
                "active:scale-95 transition-transform animate-pulseRing disabled:opacity-50"
              )}
            >
              {t("start_day")}
            </button>
          </>
        )}
      </Card>

      {/* Stop modal: break + overtime + comment in one step */}
      <Modal open={stopOpen} onClose={() => setStopOpen(false)} title={t("stop_day")}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("break_minutes")}>
              <Input type="number" inputMode="numeric" min={0} value={breakMin}
                onChange={(e) => setBreakMin(Number(e.target.value))} />
            </Field>
            <Field label={t("overtime_minutes")}>
              <Input type="number" inputMode="numeric" min={0} value={overtimeMin}
                onChange={(e) => setOvertimeMin(Number(e.target.value))} />
            </Field>
          </div>
          <Field label={t("comment")}>
            <Textarea value={comment} placeholder={t("comment_placeholder")}
              onChange={(e) => setComment(e.target.value)} />
          </Field>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setStopOpen(false)}>{t("cancel")}</Button>
            <Button
              className="flex-1"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  if (openEntry) await stopWorkday(openEntry.id, breakMin, overtimeMin, comment);
                  setStopOpen(false); setBreakMin(0); setOvertimeMin(0); setComment("");
                })
              }
            >
              {pending ? t("loading") : t("save")}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Recent entries */}
      <div>
        <h2 className="font-display font-semibold mb-3">{t("recent_entries")}</h2>
        {recent.length === 0 ? (
          <Card><EmptyState icon="◷" text={t("no_entries")} /></Card>
        ) : (
          <div className="space-y-2">
            {recent.map((e) => {
              const min = entryMinutes(e.started_at, e.ended_at, e.break_minutes);
              return (
                <Card key={e.id} className="p-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      {new Date(e.started_at).toLocaleDateString(lang === "sv" ? "sv-SE" : "en-GB", { weekday: "short", day: "numeric", month: "short" })}
                      {e.projects?.name ? ` · ${e.projects.name}` : ""}
                    </p>
                    {e.comment && <p className="text-xs text-ink-600 dark:text-white/40 truncate">{e.comment}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold tabular-nums">{formatHours(min)}</p>
                    {!e.ended_at && <Badge tone="green">●</Badge>}
                    {e.overtime_minutes > 0 && <p className="text-[10px] text-signal-amber">+{e.overtime_minutes}m OT</p>}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
