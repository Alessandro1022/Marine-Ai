"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { hasPermission, type Permission } from "@/lib/rbac";
import type { Role } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import type { TKey } from "@/lib/i18n/dictionaries";

interface NavItem {
  href: string;
  key: TKey;
  icon: string;
  permission: Permission;
  mobile?: boolean;
}

const NAV: NavItem[] = [
  { href: "/dashboard", key: "nav_dashboard", icon: "◧", permission: "notifications.read.own", mobile: true },
  { href: "/time", key: "nav_time", icon: "◷", permission: "time.report.own", mobile: true },
  { href: "/projects", key: "nav_projects", icon: "▣", permission: "projects.read.assigned", mobile: true },
  { href: "/orders", key: "nav_orders", icon: "☰", permission: "orders.read.assigned", mobile: true },
  { href: "/materials", key: "nav_materials", icon: "▤", permission: "material.report.own" },
  { href: "/leaks", key: "nav_leaks", icon: "◉", permission: "leaks.read" },
  { href: "/reports", key: "nav_reports", icon: "▥", permission: "reports.read" },
  { href: "/team", key: "nav_team", icon: "◫", permission: "users.read.all" },
  { href: "/notifications", key: "nav_notifications", icon: "◔", permission: "notifications.read.own" },
  { href: "/settings", key: "nav_settings", icon: "⚙", permission: "notifications.read.own" },
];

export function LanguageToggle() {
  const { lang, setLang } = useI18n();
  return (
    <div className="flex rounded-lg border border-black/10 dark:border-white/10 overflow-hidden text-xs font-semibold">
      {(["sv", "en"] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={cn(
            "px-2.5 py-1.5 uppercase tracking-wider transition-colors",
            lang === l
              ? "bg-gradient-to-b from-gold-400 to-gold-500 text-ink-950"
              : "text-ink-700 dark:text-white/50 hover:bg-black/5 dark:hover:bg-white/5"
          )}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      aria-label="Toggle theme"
      className="rounded-lg border border-black/10 dark:border-white/10 px-2.5 py-1.5 text-sm text-ink-700 dark:text-white/60 hover:border-gold-500/60 hover:text-gold-500 transition-colors"
    >
      {theme === "dark" ? "☀" : "☾"}
    </button>
  );
}

function Logo({ size = "md" }: { size?: "sm" | "md" }) {
  return (
    <span className="flex items-center gap-2.5">
      <span className={cn(
        "relative grid place-items-center rounded-lg bg-gradient-to-b from-gold-300 to-gold-500 font-display font-bold text-ink-950",
        "shadow-[0_1px_0_rgba(255,255,255,.4)_inset,0_4px_14px_-4px_rgba(201,154,60,.6)]",
        size === "md" ? "h-8 w-8 text-base" : "h-7 w-7 text-sm"
      )}>
        A
      </span>
      <span className={cn("font-display font-semibold tracking-tight", size === "md" ? "text-[15px]" : "text-sm")}>
        Aetos <span className="text-gold-500">Build</span>
      </span>
    </span>
  );
}

export default function AppShell({ children, role, userName, unread }: {
  children: React.ReactNode;
  role: Role;
  userName: string;
  unread: number;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useI18n();
  const items = NAV.filter((n) => hasPermission(role, n.permission));
  const mobileItems = items.filter((n) => n.mobile).slice(0, 4);

  async function signOut() {
    await createClient().auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="bp-bg min-h-dvh text-ink-900 dark:text-white">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-black/[.07] bg-white/80 backdrop-blur-xl dark:bg-ink-900/80 dark:border-white/[.06] lg:flex">
        <div className="px-5 py-5">
          <Link href="/dashboard" prefetch><Logo /></Link>
          <p className="mt-1.5 pl-[42px] font-mono text-[9px] uppercase tracking-[0.22em] text-ink-600/70 dark:text-white/25">
            Aetos Systems
          </p>
        </div>
        <nav className="flex-1 space-y-0.5 px-3 overflow-y-auto">
          {items.map((n) => {
            const active = pathname.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                prefetch
                className={cn(
                  "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-150 ease-snappy",
                  active
                    ? "bg-gold-500/10 text-gold-600 dark:text-gold-300 font-medium"
                    : "text-ink-700 dark:text-white/55 hover:bg-black/4 dark:hover:bg-white/5 hover:translate-x-0.5"
                )}
              >
                {/* blueprint active indicator */}
                <span className={cn(
                  "absolute left-0 top-1/2 -translate-y-1/2 h-4 w-[2.5px] rounded-full bg-gold-500 transition-all",
                  active ? "opacity-100" : "opacity-0 group-hover:opacity-40"
                )} />
                <span className="w-4 text-center opacity-80">{n.icon}</span>
                {t(n.key)}
                {n.href === "/notifications" && unread > 0 && (
                  <span className="ml-auto rounded-full bg-signal-red px-1.5 text-[10px] font-bold text-white">{unread}</span>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-black/[.07] dark:border-white/[.06] p-4 space-y-3">
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
          </div>
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{userName}</p>
              <p className="font-mono text-[10px] uppercase tracking-wider text-gold-600/80 dark:text-gold-400/70">{t(("role_" + role) as TKey)}</p>
            </div>
            <button onClick={signOut} className="text-xs text-ink-600 dark:text-white/40 hover:text-signal-red transition-colors">{t("sign_out")}</button>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-black/[.07] bg-white/75 px-4 py-3 backdrop-blur-xl dark:bg-ink-950/75 dark:border-white/[.06] lg:hidden">
        <Link href="/dashboard" prefetch><Logo size="sm" /></Link>
        <div className="flex items-center gap-2">
          <LanguageToggle />
          <ThemeToggle />
          <Link href="/notifications" prefetch className="relative rounded-lg border border-black/10 dark:border-white/10 px-2.5 py-1.5 text-sm">
            ◔
            {unread > 0 && <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-signal-red animate-pulse" />}
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="px-4 pb-24 pt-5 sm:px-6 lg:ml-60 lg:pb-10 lg:pt-8 max-w-6xl">
        {children}
      </main>

      {/* Mobile bottom tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-black/[.07] bg-white/85 backdrop-blur-xl dark:bg-ink-900/85 dark:border-white/[.06] lg:hidden pb-[env(safe-area-inset-bottom)]">
        {mobileItems.map((n) => {
          const active = pathname.startsWith(n.href);
          return (
            <Link key={n.href} href={n.href} prefetch className={cn(
              "relative flex flex-col items-center gap-0.5 py-2.5 text-[10px] transition-colors",
              active ? "text-gold-500 font-semibold" : "text-ink-600 dark:text-white/45"
            )}>
              {active && <span className="absolute top-0 h-[2.5px] w-8 rounded-full bg-gold-500" />}
              <span className="text-base leading-none">{n.icon}</span>
              {t(n.key)}
            </Link>
          );
        })}
        <Link href="/settings" prefetch className={cn(
          "relative flex flex-col items-center gap-0.5 py-2.5 text-[10px] transition-colors",
          pathname.startsWith("/settings") ? "text-gold-500 font-semibold" : "text-ink-600 dark:text-white/45"
        )}>
          {pathname.startsWith("/settings") && <span className="absolute top-0 h-[2.5px] w-8 rounded-full bg-gold-500" />}
          <span className="text-base leading-none">⚙</span>
          {t("nav_settings")}
        </Link>
      </nav>
    </div>
  );
}
