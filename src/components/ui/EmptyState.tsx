"use client";

import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-mist">
        <Icon size={26} strokeWidth={1.5} />
      </div>
      <div>
        <p className="font-display font-semibold">{title}</p>
        {description ? <p className="mt-1 text-sm text-mist">{description}</p> : null}
      </div>
      {action ?? null}
    </div>
  );
}
