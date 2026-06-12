"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { Card, BarChart } from "@/components/ui";
import { cn } from "@/lib/utils";

type Row = { label: string; value: number; secondary?: number };

export default function ReportsView({ range, hoursPerProject, hoursPerEmployee, materialCosts, budgetVsActual }: {
  range: string;
  hoursPerProject: Row[];
  hoursPerEmployee: Row[];
  materialCosts: Row[];
  budgetVsActual: Row[];
}) {
  const { t } = useI18n();
  const ranges = [
    { id: "week", label: t("range_week") },
    { id: "month", label: t("range_month") },
    { id: "quarter", label: t("range_quarter") },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-xl sm:text-2xl font-semibold">{t("reports_title")}</h1>
        <div className="flex rounded-lg border border-black/10 dark:border-white/10 overflow-hidden text-sm">
          {ranges.map((r) => (
            <Link key={r.id} href={`/reports?range=${r.id}`}
              className={cn("px-3 py-1.5", range === r.id ? "bg-gold-500 text-ink-950 font-semibold" : "text-ink-700 dark:text-white/50")}>
              {r.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="font-display font-semibold mb-4">{t("hours_per_project")}</h2>
          <BarChart data={hoursPerProject} unit="h" />
        </Card>
        <Card className="p-5">
          <h2 className="font-display font-semibold mb-4">{t("hours_per_employee")}</h2>
          <BarChart data={hoursPerEmployee} unit="h" />
        </Card>
        <Card className="p-5">
          <h2 className="font-display font-semibold mb-4">{t("material_costs")}</h2>
          <BarChart data={materialCosts} unit="kr" />
        </Card>
        <Card className="p-5">
          <h2 className="font-display font-semibold mb-4">{t("budget_vs_actual")}</h2>
          <p className="mb-3 text-xs text-ink-600 dark:text-white/40">■ {t("actual")} · ▢ {t("budget")}</p>
          <BarChart data={budgetVsActual} unit="kr" />
        </Card>
      </div>
    </div>
  );
}
