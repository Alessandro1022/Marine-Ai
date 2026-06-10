"use client";

import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title?: string;
  text?: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, text, description, action }: EmptyStateProps) {
  const label = title ?? text ?? "";
  const sub = description;
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      {Icon ? (
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-mist">
          <Icon size={26} strokeWidth={1.5} />
        </div>
      ) : null}
      <div>
        {label ? <p className="font-display font-semibold">{label}</p> : null}
        {sub ? <p className="mt-1 text-sm text-mist">{sub}</p> : null}
      </div>
      {action ?? null}
    </div>
  );
}
