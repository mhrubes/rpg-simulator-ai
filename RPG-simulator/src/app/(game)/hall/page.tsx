"use client";

import { useMemo, useState } from "react";
import { useI18n } from "@/providers/I18nProvider";
import { listRegisteredUsers } from "@/lib/storage/registry";
import { loadSave } from "@/lib/storage/save";

type SortMode = "level" | "underworld";

export default function HallPage() {
  const { t } = useI18n();
  const [sort, setSort] = useState<SortMode>("level");

  const rows = useMemo(() => {
    const users = listRegisteredUsers();
    const data = users.map((u) => {
      const s = loadSave(u.id);
      return {
        id: u.id,
        nickname: u.nickname,
        level: s?.level ?? 1,
        uw: u.underworldFloorsCleared ?? 0,
      };
    });
    data.sort((a, b) => (sort === "level" ? b.level - a.level : b.uw - a.uw));
    return data;
  }, [sort]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold text-white">{t("hall.title")}</h1>
        <div className="flex gap-2">
          <button
            type="button"
            className={`vb-btn ${sort === "level" ? "vb-btn-primary" : ""}`}
            onClick={() => setSort("level")}
          >
            {t("hall.sortLevel")}
          </button>
          <button
            type="button"
            className={`vb-btn ${sort === "underworld" ? "vb-btn-primary" : ""}`}
            onClick={() => setSort("underworld")}
          >
            {t("hall.sortUnderworld")}
          </button>
        </div>
      </header>
      <div className="vb-card overflow-hidden">
        <table className="w-full text-left text-base">
          <thead className="border-b border-vb-border bg-black/30 text-sm uppercase text-vb-muted">
            <tr>
              <th className="px-4 py-2">#</th>
              <th className="px-4 py-2">Hráč</th>
              <th className="px-4 py-2">{t("common.level")}</th>
              <th className="px-4 py-2">Podsvětí (patra)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id} className="border-b border-vb-border/60">
                <td className="px-4 py-2 text-vb-muted">{i + 1}</td>
                <td className="px-4 py-2 font-medium text-white">{r.nickname}</td>
                <td className="px-4 py-2 text-vb-muted">{r.level}</td>
                <td className="px-4 py-2 text-vb-muted">{r.uw}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
