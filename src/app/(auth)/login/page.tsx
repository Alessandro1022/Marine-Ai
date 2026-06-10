"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n";

export default function LoginPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error || !data.user) {
      setError(t("auth.invalidCredentials"));
      setLoading(false);
      return;
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed")
      .eq("id", data.user.id)
      .single();
    router.push(profile?.onboarding_completed ? "/dashboard" : "/onboarding");
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold glow-text">
        {t("auth.login")}
      </h1>
      <div className="mt-8 flex flex-col gap-3">
        <input
          className="input-field"
          type="email"
          autoComplete="email"
          placeholder={t("auth.email")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="input-field"
          type="password"
          autoComplete="current-password"
          placeholder={t("auth.password")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error ? <p className="text-sm text-risk-red">{error}</p> : null}
        <button
          className="btn-primary mt-2"
          onClick={handleLogin}
          disabled={loading || !email || !password}
        >
          {loading ? t("common.loading") : t("auth.login")}
        </button>
        <Link
          href="/forgot-password"
          className="mt-1 text-center text-sm text-mist underline-offset-4 hover:underline"
        >
          {t("auth.forgotPassword")}
        </Link>
        <p className="mt-4 text-center text-sm text-mist">
          {t("auth.noAccount")}{" "}
          <Link href="/register" className="text-sonar">
            {t("auth.register")}
          </Link>
        </p>
      </div>
    </div>
  );
}
EOF
cat > "src/app/(auth)/register/page.tsx" << 'EOF'
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n";

export default function RegisterPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleRegister() {
    if (form.password !== form.confirm) {
      setError(t("auth.passwordMismatch"));
      return;
    }
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { first_name: form.firstName, last_name: form.lastName },
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    if (data.session) {
      router.push("/onboarding");
    } else {
      router.push(`/verify-email?email=${encodeURIComponent(form.email)}`);
    }
  }

  const valid =
    form.firstName && form.email && form.password.length >= 6 && form.confirm;

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold glow-text">
        {t("auth.register")}
      </h1>
      <div className="mt-8 flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <input className="input-field" placeholder={t("auth.firstName")} value={form.firstName} onChange={set("firstName")} />
          <input className="input-field" placeholder={t("auth.lastName")} value={form.lastName} onChange={set("lastName")} />
        </div>
        <input className="input-field" type="email" autoComplete="email" placeholder={t("auth.email")} value={form.email} onChange={set("email")} />
        <input className="input-field" type="password" autoComplete="new-password" placeholder={t("auth.password")} value={form.password} onChange={set("password")} />
        <input className="input-field" type="password" autoComplete="new-password" placeholder={t("auth.confirmPassword")} value={form.confirm} onChange={set("confirm")} />
        {error ? <p className="text-sm text-risk-red">{error}</p> : null}
        <button className="btn-primary mt-2" onClick={handleRegister} disabled={loading || !valid}>
          {loading ? t("common.loading") : t("auth.register")}
        </button>
        <p className="mt-4 text-center text-sm text-mist">
          {t("auth.hasAccount")}{" "}
          <Link href="/login" className="text-sonar">
            {t("auth.login")}
          </Link>
        </p>
      </div>
    </div>
  );
}
EOF
cat > "src/app/(auth)/forgot-password/page.tsx" << 'EOF'
"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n";

export default function ForgotPasswordPage() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSend() {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSent(true);
    setLoading(false);
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold glow-text">
        {t("auth.resetPassword")}
      </h1>
      <div className="mt-8 flex flex-col gap-3">
        {sent ? (
          <p className="glass-card p-4 text-sm text-mist">{t("auth.resetLinkSent")}</p>
        ) : (
          <>
            <input
              className="input-field"
              type="email"
              placeholder={t("auth.email")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button className="btn-primary mt-2" onClick={handleSend} disabled={loading || !email}>
              {loading ? t("common.loading") : t("auth.sendResetLink")}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
EOF
cat > "src/app/(auth)/reset-password/page.tsx" << 'EOF'
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n";

export default function ResetPasswordPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleUpdate() {
    if (password !== confirm) {
      setError(t("auth.passwordMismatch"));
      return;
    }
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    router.push("/dashboard");
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold glow-text">
        {t("auth.updatePassword")}
      </h1>
      <div className="mt-8 flex flex-col gap-3">
        <input className="input-field" type="password" placeholder={t("auth.newPassword")} value={password} onChange={(e) => setPassword(e.target.value)} />
        <input className="input-field" type="password" placeholder={t("auth.confirmPassword")} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        {error ? <p className="text-sm text-risk-red">{error}</p> : null}
        <button className="btn-primary mt-2" onClick={handleUpdate} disabled={loading || password.length < 6 || !confirm}>
          {loading ? t("common.loading") : t("auth.updatePassword")}
        </button>
      </div>
    </div>
  );
}
EOF
cat > "src/app/(auth)/verify-email/page.tsx" << 'EOF'
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MailCheck } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function VerifyEmailPage() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");

  useEffect(() => {
    setEmail(new URLSearchParams(window.location.search).get("email") ?? "");
  }, []);

  return (
    <div className="text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-sonar/10 text-sonar shadow-sonar">
        <MailCheck size={26} strokeWidth={1.75} />
      </span>
      <h1 className="mt-6 font-display text-2xl font-semibold glow-text">
        {t("auth.verifyEmailTitle")}
      </h1>
      <p className="mt-3 text-sm text-mist">
        {t("auth.verifyEmailBody", { email })}
      </p>
      <Link href="/login" className="btn-ghost mt-8 inline-flex">
        {t("auth.login")}
      </Link>
    </div>
  );
}
