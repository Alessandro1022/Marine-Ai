"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Map, Bot, BookOpen, User } from "lucide-react";
import { useT } from "@/lib/i18n";

const TABS = [
  { href: "/dashboard", icon: Home, key: "nav.home" },
  { href: "/map", icon: Map, key: "nav.map" },
  { href: "/ai", icon: Bot, key: "nav.ai" },
  { href: "/logbook", icon: BookOpen, key: "nav.logbook" },
  { href: "/profile", icon: User, key: "nav.profile" },
] as const;

export function BottomTabBar() {
  const pathname = usePathname();
  const t = useT();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 pb-[env(safe-area-inset-bottom)]"
      style={{
        background: "linear-gradient(180deg, rgba(4,10,18,0.0) 0%, rgba(4,10,18,0.97) 18%)",
        backdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(45,224,190,0.13)",
      }}
    >
      {/* Holographic wave line */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "1px",
          background:
            "linear-gradient(90deg, transparent 0%, rgba(45,224,190,0.0) 10%, rgba(45,224,190,0.55) 35%, rgba(94,160,255,0.7) 50%, rgba(45,224,190,0.55) 65%, rgba(45,224,190,0.0) 90%, transparent 100%)",
          filter: "blur(0.5px)",
        }}
      />

      <div className="mx-auto flex max-w-md justify-around px-1">
        {TABS.map(({ href, icon: Icon, key }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className="relative flex flex-col items-center gap-1 px-3 py-3 transition-all"
            >
              {/* Active glow blob behind icon */}
              {active && (
                <span
                  aria-hidden
                  style={{
                    position: "absolute",
                    top: 6,
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: "radial-gradient(circle, rgba(45,224,190,0.22) 0%, transparent 70%)",
                    pointerEvents: "none",
                  }}
                />
              )}

              <span
                style={{
                  color: active ? "#2DE0BE" : "#6B8FA8",
                  filter: active ? "drop-shadow(0 0 7px rgba(45,224,190,0.85))" : "none",
                  transition: "color 0.2s, filter 0.2s",
                }}
              >
                <Icon size={22} strokeWidth={active ? 2 : 1.5} />
              </span>

              <span
                style={{
                  fontSize: "0.58rem",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  fontWeight: active ? 600 : 400,
                  color: active ? "#2DE0BE" : "#4A6878",
                  transition: "color 0.2s",
                }}
              >
                {t(key)}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
