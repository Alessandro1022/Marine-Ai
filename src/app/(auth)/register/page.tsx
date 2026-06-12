"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n";
import { Button, Card, Field, Input } from "@/components/ui";
import { LanguageToggle, ThemeToggle } from "@/components/AppShell";

export default function RegisterPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [companyName, setCompanyName] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit() {
    setBusy(true); setError("");
    const supabase = createClient();

    const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
    if (signUpError || !data.user) {
      setError(signUpError?.message || "Sign up failed"); setBusy(false); return;
    }
    // If email confirmation is on, session may be missing — sign in directly.
    if (!data.session) {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) { setError(signInError.message); setBusy(false); return; }
    }

    const { error: rpcError } = await supabase.rpc("register_company", {
      company_name: companyName.trim(),
      owner_name: fullName.trim(),
      owner_email: email.trim(),
    });
    if (rpcError) { setError(rpcError.message); setBusy(false); return; }

    router.push("/dashboard");
    router.refresh();
  }

  const valid = companyName && fullName && email && password.length >= 6;

  return (
    <div className="bp-bg min-h-dvh flex flex-col">
      <div className="flex justify-end gap-2 p-4"><LanguageToggle /><ThemeToggle /></div>
      <div className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-gold-500 font-display text-2xl font-bold text-ink-950">A</span>
            <h1 className="font-display text-2xl font-semibold text-ink-900 dark:text-white">{t("register_title")}</h1>
            <p className="mt-1 text-sm text-ink-600 dark:text-white/40">{t("register_owner_note")}</p>
          </div>
          <Card className="p-6 space-y-4">
            <Field label={t("company_name")}>
              <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
            </Field>
            <Field label={t("full_name")}>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" />
            </Field>
            <Field label={t("email")}>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            </Field>
            <Field label={t("password")}>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
            </Field>
            {error && <p className="text-sm text-signal-red">{error}</p>}
            <Button size="lg" className="w-full" onClick={onSubmit} disabled={busy || !valid}>
              {busy ? t("loading") : t("register_cta")}
            </Button>
            <p className="text-center text-sm text-ink-600 dark:text-white/40">
              {t("have_account")}{" "}
              <Link href="/login" className="text-gold-600 dark:text-gold-400 hover:underline">{t("login_cta")}</Link>
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
