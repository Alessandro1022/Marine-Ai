"use client";

import { cn } from "@/lib/utils";
import { useEffect, useRef, useState, type ReactNode, type ButtonHTMLAttributes, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";

/* ---------- Card — blueprint edition ---------- */
export function Card({ children, className, glow, danger, interactive }: {
  children: ReactNode; className?: string; glow?: boolean; danger?: boolean; interactive?: boolean;
}) {
  return (
    <div
      className={cn(
        "bp-card rounded-xl2 border bg-white/90 shadow-card shadow-inset backdrop-blur-sm",
        "border-black/[.08] dark:border-white/[.07] dark:bg-surface/90",
        interactive && "transition-all duration-200 ease-snappy hover:-translate-y-0.5 hover:border-gold-500/40 hover:shadow-glow",
        glow && "shadow-glow border-gold-500/35",
        danger && "shadow-glowRed border-signal-red/30",
        className
      )}
    >
      {children}
    </div>
  );
}

/* ---------- Eyebrow — blueprint annotation label ---------- */
export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn(
      "flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-600 dark:text-white/35",
      className
    )}>
      <span className="h-px w-4 bg-gold-500/70" />
      {children}
    </p>
  );
}

/* ---------- Animated number ---------- */
export function CountUp({ value, format, duration = 800 }: {
  value: number; format?: (n: number) => string; duration?: number;
}) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<number>(0);

  useEffect(() => {
    const from = ref.current;
    const start = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(from + (value - from) * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
      else ref.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return <>{format ? format(display) : Math.round(display)}</>;
}

/* ---------- Button ---------- */
type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg";
};
export function Button({ variant = "primary", size = "md", className, ...props }: BtnProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-150 ease-snappy",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400",
        "disabled:opacity-50 disabled:pointer-events-none active:scale-[.97]",
        size === "sm" && "h-8 px-3 text-sm",
        size === "md" && "h-10 px-4 text-sm",
        size === "lg" && "h-12 px-6 text-base",
        variant === "primary" &&
          "bg-gradient-to-b from-gold-400 to-gold-500 text-ink-950 font-semibold hover:from-gold-300 hover:to-gold-400 shadow-[0_1px_0_rgba(255,255,255,.3)_inset,0_4px_12px_-4px_rgba(201,154,60,.5)]",
        variant === "ghost" &&
          "text-ink-700 hover:bg-black/5 dark:text-white/70 dark:hover:bg-white/5",
        variant === "outline" &&
          "border border-black/10 dark:border-white/15 hover:border-gold-500/60 hover:text-gold-600 dark:hover:text-gold-300 text-ink-800 dark:text-white/85",
        variant === "danger" && "bg-signal-red/90 text-white hover:bg-signal-red",
        className
      )}
      {...props}
    />
  );
}

/* ---------- Badge ---------- */
export function Badge({ children, tone = "neutral", className }: {
  children: ReactNode;
  tone?: "neutral" | "gold" | "green" | "red" | "amber" | "blue";
  className?: string;
}) {
  const tones = {
    neutral: "bg-black/5 text-ink-800 dark:bg-white/8 dark:text-white/70 border-transparent",
    gold: "bg-gold-500/12 text-gold-600 dark:text-gold-300 border-gold-500/25",
    green: "bg-signal-green/12 text-emerald-700 dark:text-signal-green border-signal-green/25",
    red: "bg-signal-red/12 text-signal-red border-signal-red/25",
    amber: "bg-signal-amber/12 text-amber-700 dark:text-signal-amber border-signal-amber/25",
    blue: "bg-signal-blue/12 text-signal-blue border-signal-blue/25",
  };
  return (
    <span className={cn("inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold tracking-wide", tones[tone], className)}>
      {children}
    </span>
  );
}

/* ---------- Stat — hero metric ---------- */
export function Stat({ label, value, sub, tone, format, raw }: {
  label: string; value?: number; raw?: string; sub?: string;
  tone?: "gold" | "green" | "red"; format?: (n: number) => string;
}) {
  return (
    <Card interactive className="p-4 sm:p-5 animate-rise">
      <Eyebrow>{label}</Eyebrow>
      <p
        className={cn(
          "mt-2 font-display text-2xl sm:text-[2rem] leading-tight font-semibold tnum",
          tone === "gold" && "text-gold-500 dark:text-gold-400",
          tone === "green" && "text-emerald-600 dark:text-signal-green",
          tone === "red" && "text-signal-red",
          !tone && "text-ink-900 dark:text-white"
        )}
      >
        {raw !== undefined ? raw : <CountUp value={value ?? 0} format={format} />}
      </p>
      {sub && <p className="mt-1 text-xs text-ink-600 dark:text-white/40">{sub}</p>}
    </Card>
  );
}

/* ---------- Inputs ---------- */
const fieldBase =
  "w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-ink-900 placeholder:text-ink-600/50 transition-colors " +
  "border-black/10 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/25 " +
  "dark:bg-ink-900/80 dark:text-white dark:border-white/10 dark:placeholder:text-white/30";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(fieldBase, props.className)} />;
}
export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn(fieldBase, "appearance-none", props.className)} />;
}
export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(fieldBase, "min-h-[80px]", props.className)} />;
}
export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-ink-700 dark:text-white/60">{label}</span>
      {children}
    </label>
  );
}

/* ---------- Modal ---------- */
export function Modal({ open, onClose, title, children }: {
  open: boolean; onClose: () => void; title: string; children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-ink-950/70 backdrop-blur-md" onClick={onClose} />
      <div className="bp-card relative w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-xl2 bg-white dark:bg-surface-raised border border-black/10 dark:border-gold-500/15 p-5 sm:p-6 animate-rise shadow-glow">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-semibold text-ink-900 dark:text-white">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="rounded-md p-1.5 text-ink-600 hover:bg-black/5 dark:text-white/50 dark:hover:bg-white/10">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ---------- Empty state ---------- */
export function EmptyState({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-xl2 border border-dashed border-gold-500/40 text-2xl text-gold-500/70 mb-4">{icon}</div>
      <p className="text-sm text-ink-600 dark:text-white/40 max-w-xs">{text}</p>
    </div>
  );
}

/* ---------- Progress ---------- */
export function ProgressBar({ value, danger }: { value: number; danger?: boolean }) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div className="relative h-2 w-full rounded-full bg-black/8 dark:bg-white/8 overflow-hidden">
      {/* major-grid ticks at 25/50/75 */}
      {[25, 50, 75].map((tick) => (
        <span key={tick} className="absolute inset-y-0 w-px bg-black/10 dark:bg-white/10" style={{ left: `${tick}%` }} />
      ))}
      <div
        className={cn(
          "h-full rounded-full transition-all duration-500 ease-snappy",
          danger || pct >= 100
            ? "bg-gradient-to-r from-signal-red/80 to-signal-red"
            : pct >= 85
              ? "bg-gradient-to-r from-signal-amber/80 to-signal-amber"
              : "bg-gradient-to-r from-gold-600 to-gold-400"
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/* ---------- SVG bar chart (zero deps) ---------- */
export function BarChart({ data, unit }: { data: { label: string; value: number; secondary?: number }[]; unit?: string }) {
  const max = Math.max(1, ...data.map((d) => Math.max(d.value, d.secondary ?? 0)));
  if (data.length === 0) return <EmptyState icon="▥" text="—" />;
  return (
    <div className="space-y-3.5">
      {data.map((d, i) => (
        <div key={d.label} className="animate-rise" style={{ animationDelay: `${i * 40}ms` }}>
          <div className="flex items-baseline justify-between mb-1.5">
            <span className="text-xs text-ink-700 dark:text-white/60 truncate max-w-[60%]">{d.label}</span>
            <span className="font-mono text-xs font-medium tnum text-ink-900 dark:text-gold-300">
              {new Intl.NumberFormat("sv-SE", { maximumFractionDigits: 1 }).format(d.value)}{unit ? ` ${unit}` : ""}
            </span>
          </div>
          <div className="relative h-2.5 rounded-full bg-black/8 dark:bg-white/8 overflow-hidden">
            {d.secondary !== undefined && (
              <div className="absolute inset-y-0 left-0 rounded-full border-r-2 border-dashed border-ink-600/50 dark:border-white/30 bg-ink-600/15 dark:bg-white/10" style={{ width: `${(d.secondary / max) * 100}%` }} />
            )}
            <div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-gold-600 to-gold-400 transition-all duration-700 ease-snappy" style={{ width: `${(d.value / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------- Skeletons (perceived speed) ---------- */
export function SkeletonRow({ h = "h-16" }: { h?: string }) {
  return <div className={cn("skeleton w-full", h)} />;
}
export function PageSkeleton() {
  return (
    <div className="space-y-5">
      <div className="skeleton h-8 w-48" />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <SkeletonRow h="h-24" /><SkeletonRow h="h-24" /><SkeletonRow h="h-24" /><SkeletonRow h="h-24" />
      </div>
      <SkeletonRow h="h-32" />
      <div className="grid gap-3 sm:grid-cols-2"><SkeletonRow h="h-28" /><SkeletonRow h="h-28" /></div>
    </div>
  );
}
