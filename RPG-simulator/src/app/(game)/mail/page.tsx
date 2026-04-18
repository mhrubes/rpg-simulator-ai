"use client";

import { useI18n } from "@/providers/I18nProvider";
import { useGameStore } from "@/stores/gameStore";

export default function MailPage() {
  const { t } = useI18n();
  const game = useGameStore((s) => s.game)!;
  const respond = useGameStore((s) => s.respondMail);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-white">{t("mail.title")}</h1>
      </header>
      <div className="space-y-3">
        {game.mail.length === 0 && <p className="text-base text-vb-muted">Žádné zprávy.</p>}
        {game.mail.map((m) => (
          <div key={m.id} className="vb-card p-4">
            <h2 className="font-semibold text-white">{m.title}</h2>
            <p className="mt-1 text-base text-vb-muted">{m.body}</p>
            {m.type === "guild_invite" && (
              <div className="mt-3 flex gap-2">
                <button type="button" className="vb-btn vb-btn-primary" onClick={() => respond(m.id, true)}>
                  {t("mail.accept")}
                </button>
                <button type="button" className="vb-btn" onClick={() => respond(m.id, false)}>
                  {t("mail.reject")}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
