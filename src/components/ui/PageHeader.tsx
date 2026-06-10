"use client";

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="mb-5 flex items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-2xl font-semibold glow-text">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-mist">{subtitle}</p> : null}
      </div>
      {action}
    </header>
  );
}
EOF
cat > src/components/ui/EmptyState.tsx << 'EOF'
"use client";

import { Waves } from "lucide-react";

export function EmptyState({ text, action }: { text: string; action?: React.ReactNode }) {
  return (
    <div className="glass-card flex flex-col items-center gap-3 p-8 text-center">
      <Waves size={28} className="text-sonar/60" strokeWidth={1.5} />
      <p className="text-sm text-mist">{text}</p>
      {action}
    </div>
  );
}
EOF
cat > src/components/ui/LoadingScreen.tsx << 'EOF'
"use client";

export function LoadingScreen() {
  return (
    <div className="flex min-h-[40dvh] items-center justify-center">
      <div className="radar h-20 w-20" aria-label="Loading" />
    </div>
  );
}
