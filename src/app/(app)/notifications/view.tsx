"use client";

import { useTransition } from "react";
import { useI18n } from "@/lib/i18n";
import { markAllRead } from "@/app/actions";
import { Button, Card, EmptyState, Badge } from "@/components/ui";

interface Notif { id: string; type: string; title: string; body: string | null; read: boolean; created_at: string }

export default function NotificationsView({ items }: { items: Notif[] }) {
  const { t, lang } = useI18n();
  const [pending, start] = useTransition();

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl sm:text-2xl font-semibold">{t("notifications_title")}</h1>
        {items.some((i) => !i.read) && (
          <Button variant="outline" size="sm" disabled={pending} onClick={() => start(() => markAllRead())}>
            {t("mark_all_read")}
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <Card><EmptyState icon="◔" text={t("no_notifications")} /></Card>
      ) : (
        <div className="space-y-2">
          {items.map((n) => (
            <Card key={n.id} className={n.read ? "p-4 opacity-60" : "p-4 border-gold-500/30"}>
              <div className="flex items-center gap-2">
                {!n.read && <span className="h-2 w-2 rounded-full bg-gold-500" />}
                <p className="text-sm font-medium">{n.title}</p>
                <Badge tone="neutral" className="ml-auto">
                  {new Date(n.created_at).toLocaleDateString(lang === "sv" ? "sv-SE" : "en-GB", { day: "numeric", month: "short" })}
                </Badge>
              </div>
              {n.body && <p className="mt-1 text-xs text-ink-600 dark:text-white/40">{n.body}</p>}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
