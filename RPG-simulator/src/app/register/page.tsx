"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { useI18n } from "@/providers/I18nProvider";
import { useGameStore } from "@/stores/gameStore";
import type { PlayerClass } from "@/lib/game/types";

const classes: { id: PlayerClass; key: string }[] = [
  { id: "knight", key: "class.knight" },
  { id: "archer", key: "class.archer" },
  { id: "mage", key: "class.mage" },
];

export default function RegisterPage() {
  const { t } = useI18n();
  const router = useRouter();
  const registerAndLogin = useGameStore((s) => s.registerAndLogin);
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [playerClass, setPlayerClass] = useState<PlayerClass>("knight");
  const [err, setErr] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const r = registerAndLogin(nickname, password, playerClass);
    if (!r.ok) setErr(r.error === "duplicate" ? "nick" : "error");
    else router.replace("/tavern");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="vb-card vb-glow w-full max-w-md p-8"
      >
        <h1 className="text-center text-3xl font-bold text-white">{t("auth.register")}</h1>
        <form className="mt-8 space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="mb-1 block text-sm font-medium text-vb-muted">{t("auth.nickname")}</label>
            <input className="vb-input" value={nickname} onChange={(e) => setNickname(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-vb-muted">{t("auth.password")}</label>
            <input className="vb-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-vb-muted">{t("class.pick")}</p>
            <div className="grid grid-cols-3 gap-2">
              {classes.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setPlayerClass(c.id)}
                  className={`rounded-lg border px-2 py-3 text-sm font-semibold transition ${
                    playerClass === c.id
                      ? "border-amber-500/60 bg-amber-500/15 text-amber-100"
                      : "border-vb-border bg-vb-bg text-vb-muted hover:border-amber-500/30"
                  }`}
                >
                  {t(c.key)}
                </button>
              ))}
            </div>
          </div>
          {err && <p className="text-base text-red-400">{err === "nick" ? "Přezdívka už existuje." : "Chyba."}</p>}
          <button type="submit" className="vb-btn vb-btn-primary w-full">
            {t("auth.submitRegister")}
          </button>
        </form>
        <p className="mt-6 text-center text-base text-vb-muted">
          <Link href="/login" className="text-amber-300 hover:underline">
            {t("auth.switchToLogin")}
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
