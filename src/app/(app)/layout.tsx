
"use client";

import { useEffect } from "react";
import { BottomTabBar } from "@/components/nav/BottomTabBar";
import { useAuthStore } from "@/stores/authStore";
import { useBoatStore } from "@/stores/boatStore";
import { useSettingsStore } from "@/stores/settingsStore";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const initAuth = useAuthStore((s) => s.init);
  const loadBoats = useBoatStore((s) => s.load);
  const loadSettings = useSettingsStore((s) => s.load);

  useEffect(() => {
    void initAuth();
    void loadBoats();
    void loadSettings();
  }, [initAuth, loadBoats, loadSettings]);

  return (
    <div className="holo-grid min-h-dvh">
      <main className="mx-auto max-w-md px-5 pb-28 pt-[max(env(safe-area-inset-top),1.5rem)]">
        {children}
      </main>
      <BottomTabBar />
    </div>
  );
}
