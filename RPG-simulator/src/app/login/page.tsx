"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { useI18n } from "@/providers/I18nProvider";
import { useGameStore } from "@/stores/gameStore";

export default function LoginPage() {
  const { t } = useI18n();
  const router = useRouter();
  const login = useGameStore((s) => s.login);
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const r = login(nickname, password);
    if (!r.ok) setErr(r.error ?? "error");
    else router.replace("/tavern");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="vb-card vb-glow w-full max-w-md p-8"
      >
        <h1 className="text-center text-3xl font-bold tracking-tight text-white">{t("app.title")}</h1>
        <p className="mt-2 text-center text-base text-vb-muted">{t("app.tagline")}</p>
        <form className="mt-8 space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="mb-1 block text-sm font-medium text-vb-muted">{t("auth.nickname")}</label>
            <input className="vb-input" value={nickname} onChange={(e) => setNickname(e.target.value)} autoComplete="username" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-vb-muted">{t("auth.password")}</label>
            <input
              className="vb-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          {err && <p className="text-base text-red-400">{err}</p>}
          <button type="submit" className="vb-btn vb-btn-primary w-full">
            {t("auth.submitLogin")}
          </button>
        </form>
        <p className="mt-6 text-center text-base text-vb-muted">
          <Link href="/register" className="text-amber-300 hover:underline">
            {t("auth.switchToRegister")}
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
