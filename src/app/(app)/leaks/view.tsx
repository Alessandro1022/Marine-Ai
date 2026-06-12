"use client";

import { useI18n } from "@/lib/i18n";
import { Card, Badge, EmptyState } from "@/components/ui";
import { formatSEK } from "@/lib/utils";

export interface Leak {
  type: "missing_time" | "unreported_material" | "overdue_order" | "budget_risk" | "over_budget";
  title: string;
  detail: string;
  cost: number;
}

const META: Record<Leak["type"], { icon: string; tone: "red" | "amber"; key: string }> = {
  missing_time: { icon: "◷", tone: "amber", key: "leak_missing_time" },
  unreported_material: { icon: "▤", tone: "amber", key: "leak_unreported_material" },
  overdue_order: { icon: "☰", tone: "red", key: "leak_overdue_orders" },
  budget_risk: { icon: "◉", tone: "amber", key: "leak_budget_risk" },
  over_budget: { icon: "◉", tone: "red", key: "leak_over_budget" },
};

export default function LeaksView({ leaks }: { leaks: Leak[] }) {
  const { t } = useI18n();
  const total = leaks.reduce((s, l) => s + l.cost, 0);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-xl sm:text-2xl font-semibold">{t("leaks_title")}</h1>
        <p className="mt-1 text-sm text-ink-600 dark:text-white/40">{t("leaks_subtitle")}</p>
      </div>

      <Card glow className="p-5 sm:p-6">
        <p className="text-xs uppercase tracking-wider text-ink-600 dark:text-white/40">{t("total_at_risk")}</p>
        <p className="mt-1 font-display text-3xl sm:text-4xl font-semibold tabular-nums text-signal-red">
          {formatSEK(total)}
        </p>
      </Card>

      {leaks.length === 0 ? (
        <Card><EmptyState icon="✓" text={t("no_leaks")} /></Card>
      ) : (
        <div className="space-y-2">
          {leaks.map((l, i) => {
            const m = META[l.type];
            return (
              <Card key={i} className="p-4 flex items-center gap-4">
                <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl text-lg ${m.tone === "red" ? "bg-signal-red/12 text-signal-red" : "bg-signal-amber/12 text-signal-amber"}`}>
                  {m.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge tone={m.tone}>{t(m.key as never)}</Badge>
                    {l.detail && <span className="text-xs text-ink-600 dark:text-white/40">{l.detail}</span>}
                  </div>
                  <p className="mt-1 text-sm">
                    <span className="font-medium">{l.title}</span>{" "}
                    <span className="text-ink-600 dark:text-white/40">{t("leak_risk")}</span>{" "}
                    <span className="font-semibold text-signal-red tabular-nums">{formatSEK(l.cost)}</span>{" "}
                    <span className="text-ink-600 dark:text-white/40">{t("leak_loss")}</span>
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
