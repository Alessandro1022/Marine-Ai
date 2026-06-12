"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { formatSEK } from "@/lib/utils";
import { Card, Stat, Badge, ProgressBar, EmptyState } from "@/components/ui";

export default function DashboardView({ stats, ongoing, warnings }: {
  stats: { activeProjects: number; workersToday: number; hoursToday: number; expectedInvoicing: number; canFinance: boolean };
  ongoing: { id: string; name: string; customer: string | null; budget: number; spent: number }[];
  warnings: { missingTime: number; overBudget: string[]; overdueOrders: number };
}) {
  const { t } = useI18n();
  const hasWarnings = warnings.missingTime > 0 || warnings.overBudget.length > 0 || warnings.overdueOrders > 0;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-xl sm:text-2xl font-semibold">{t("nav_dashboard")}</h1>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Stat label={t("dash_active_projects")} value={stats.activeProjects} />
        <Stat label={t("dash_workers_today")} value={stats.workersToday} />
        <Stat label={t("dash_hours_today")} value={stats.hoursToday} format={(n) => n.toFixed(1) + " h"} tone="green" />
        {stats.canFinance && (
          <Stat label={t("dash_expected_invoicing")} value={stats.expectedInvoicing} format={formatSEK} tone="gold" sub={t("today")} />
        )}
      </div>

      {/* Warnings */}
      <Card className={hasWarnings ? "p-5 border-signal-amber/40" : "p-5"}>
        <h2 className="font-display font-semibold mb-3 flex items-center gap-2">
          <span className={hasWarnings ? "text-signal-amber" : "text-signal-green"}>{hasWarnings ? "⚠" : "✓"}</span>
          {t("dash_warnings")}
        </h2>
        {!hasWarnings ? (
          <p className="text-sm text-ink-600 dark:text-white/40">{t("dash_no_warnings")}</p>
        ) : (
          <div className="space-y-2 text-sm">
            {warnings.missingTime > 0 && (
              <div className="flex items-center justify-between">
                <span>{t("dash_missing_time")}</span>
                <Badge tone="amber">{warnings.missingTime}</Badge>
              </div>
            )}
            {warnings.overdueOrders > 0 && (
              <div className="flex items-center justify-between">
                <span>{t("leak_overdue_orders")}</span>
                <Badge tone="red">{warnings.overdueOrders}</Badge>
              </div>
            )}
            {warnings.overBudget.map((name) => (
              <div key={name} className="flex items-center justify-between">
                <span>{name}</span>
                <Badge tone="red">{t("dash_over_budget")}</Badge>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Ongoing projects */}
      <div>
        <h2 className="font-display font-semibold mb-3">{t("dash_ongoing")}</h2>
        {ongoing.length === 0 ? (
          <Card><EmptyState icon="▣" text={t("no_projects")} /></Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {ongoing.map((p) => {
              const pct = p.budget > 0 ? (p.spent / p.budget) * 100 : 0;
              return (
                <Link key={p.id} href={`/projects/${p.id}`}>
                  <Card className="p-4 hover:border-gold-500/40 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium truncate">{p.name}</p>
                        {p.customer && <p className="text-xs text-ink-600 dark:text-white/40 truncate">{p.customer}</p>}
                      </div>
                      <Badge tone={pct > 100 ? "red" : pct > 85 ? "amber" : "green"}>
                        {t("status_active")}
                      </Badge>
                    </div>
                    {stats.canFinance && p.budget > 0 && (
                      <div className="mt-3 space-y-1.5">
                        <ProgressBar value={pct} />
                        <p className="text-xs text-ink-600 dark:text-white/40 tabular-nums">
                          {formatSEK(p.spent)} / {formatSEK(p.budget)} ({Math.round(pct)}% {t("of_budget")})
                        </p>
                      </div>
                    )}
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
