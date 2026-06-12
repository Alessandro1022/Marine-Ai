"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n";
import { Button, Card, Field, Input } from "@/components/ui";
import { LanguageToggle, ThemeToggle } from "@/components/AppShell";

export default function LoginPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit() {
    setBusy(true); setError("");
    const { error } = await createClient().auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); setBusy(false); return; }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="bp-bg min-h-dvh flex flex-col">
      <div className="flex justify-end gap-2 p-4"><LanguageToggle /><ThemeToggle /></div>
      <div className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-gold-500 font-display text-2xl font-bold text-ink-950">A</span>
            <h1 className="font-display text-2xl font-semibold text-ink-900 dark:text-white">Aetos <span className="text-gold-500">Build AI</span></h1>
            <p className="mt-1 text-sm text-ink-600 dark:text-white/40">{t("tagline")}</p>
          </div>
          <Card className="p-6 space-y-4">
            <h2 className="font-display font-semibold text-ink-900 dark:text-white">{t("login_title")}</h2>
            <Field label={t("email")}>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            </Field>
            <Field label={t("password")}>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
            </Field>
            {error && <p className="text-sm text-signal-red">{error}</p>}
            <Button size="lg" className="w-full" onClick={onSubmit} disabled={busy || !email || !password}>
              {busy ? t("loading") : t("login_cta")}
            </Button>
            <p className="text-center text-sm text-ink-600 dark:text-white/40">
              {t("no_account")}{" "}
              <Link href="/register" className="text-gold-600 dark:text-gold-400 hover:underline">{t("register_cta")}</Link>
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
